// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { Router } from '@angular/router';

export interface LoginRequest {
  username: string;
  password: string;
  deviceId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userInfo: UserInfo;
}

export interface UserInfo {
  userId: string;
  username: string;
  email: string;
  role: string;
  cooperativeId?: string;
  preferredLanguage: string;
  firstLogin: boolean;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface UserDisplayInfo {
  name: string;
  role: string;
  initials: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  public userDisplayInfo$: Observable<UserDisplayInfo | null>;

  constructor(
    private apiClient: ApiClientService,
    private router: Router
  ) {
    this.loadStoredUser();

    this.userDisplayInfo$ = this.currentUser$.pipe(
      map(user => user ? this.mapToDisplayInfo(user) : null)
    );
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        console.log('✅ Loaded stored user:', user);
      } catch (e) {
        console.error('❌ Failed to parse stored user:', e);
        this.clearStoredData();
      }
    }
  }

  private mapToDisplayInfo(user: UserInfo): UserDisplayInfo {
    return {
      name: user.username || user.email || 'User',
      role: this.formatRole(user.role),
      initials: this.getInitials(user.username || user.email || 'User'),
      email: user.email || ''
    };
  }

  private formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'COOPERATIVE': 'Cooperative Manager',
      'FARMER':      'Farmer',
      'GOVERNMENT':  'Government Official'
    };
    return roleMap[role] || role;
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getUserDisplayInfo(): UserDisplayInfo {
    const user = this.getCurrentUser();
    if (user) return this.mapToDisplayInfo(user);
    return { name: 'User', role: 'Guest', initials: 'U', email: '' };
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('🔐 Attempting login with:', credentials.username);

    if (!credentials.deviceId) {
      // Use a per-user device key so different users on the same browser
      // never share the same deviceId — this was a contributing cause of
      // the duplicate refresh-token constraint violation.
      credentials.deviceId = this.getOrCreateDeviceId(credentials.username);
    }

    return this.apiClient.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', credentials).pipe(
      map(response => response.data || response as any),
      tap(loginData => {
        console.log('✅ Login response received:', loginData);
        this.handleLoginSuccess(loginData);
      }),
      catchError(error => {
        console.error('❌ Login failed:', error);
        return throwError(() => this.formatError(error));
      })
    );
  }

  qrLogin(registrationNumber: string): Observable<LoginResponse> {
    console.log('📱 Attempting QR login with registration:', registrationNumber);
    const deviceId = this.getOrCreateDeviceId(registrationNumber);

    return this.apiClient.post<ApiResponse<LoginResponse>>('/api/v1/auth/qr-login', {
      registrationNumber,
      deviceId
    }).pipe(
      map(response => response.data || response as any),
      tap(loginData => this.handleLoginSuccess(loginData)),
      catchError(error => {
        console.error('❌ QR Login failed:', error);
        return throwError(() => this.formatError(error));
      })
    );
  }

  changePassword(request: PasswordChangeRequest): Observable<void> {
    const userId = this.getCurrentUser()?.userId;
    if (!userId) {
      return throwError(() => ({ message: 'User not authenticated' }));
    }

    return this.apiClient.put<ApiResponse<void>>(`/api/v1/auth/password/change`, request).pipe(
      tap(() => console.log('✅ Password changed successfully')),
      map(() => undefined),
      catchError(error => {
        console.error('❌ Password change failed:', error);
        return throwError(() => this.formatError(error));
      })
    );
  }

  setFirstLoginPassword(newPassword: string, confirmPassword: string): Observable<void> {
    const userId = this.getCurrentUser()?.userId;
    if (!userId) {
      return throwError(() => ({ message: 'User not authenticated' }));
    }

    return this.apiClient.post<ApiResponse<void>>('/api/v1/auth/password/first-login', {
      newPassword,
      confirmPassword,
      preferredLanguage: this.getCurrentUser()?.preferredLanguage || 'fr'
    }).pipe(
      tap(() => {
        console.log('✅ First login password set successfully');
        const user = this.getCurrentUser();
        if (user) {
          user.firstLogin = false;
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      }),
      map(() => undefined),
      catchError(error => throwError(() => this.formatError(error)))
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => ({ message: 'No refresh token available' }));
    }

    return this.apiClient.post<ApiResponse<LoginResponse>>('/api/v1/auth/refresh', {
      refreshToken
    }).pipe(
      map(response => response.data || response as any),
      tap(loginData => {
        localStorage.setItem('accessToken', loginData.accessToken);
        console.log('✅ Token refreshed successfully');
      }),
      catchError(error => {
        console.error('❌ Token refresh failed:', error);
        this.logout();
        return throwError(() => this.formatError(error));
      })
    );
  }

  logout(): void {
    const userId   = this.currentUserSubject.value?.userId;
    const deviceId = this.getDeviceId();

    if (userId) {
      this.apiClient.post('/api/v1/auth/logout', { userId, deviceId }).subscribe({
        next: () => console.log('✅ Logout successful'),
        error: (err) => console.error('❌ Logout error:', err)
      });
    }

    this.clearStoredData();
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to the correct dashboard for the logged-in user's role.
   * Call this from the login component after a successful login.
   */
  navigateToDashboard(role: string): void {
    switch (role.toUpperCase()) {
      case 'GOVERNMENT':
        console.log('📍 Navigating to government dashboard');
        this.router.navigate(['/government']);
        break;
      case 'COOPERATIVE':
        console.log('📍 Navigating to cooperative dashboard');
        this.router.navigate(['/cooperative']);
        break;
      case 'FARMER':
        console.log('📍 Navigating to farmer dashboard');
        this.router.navigate(['/farmer/dashboard']);
        break;
      default:
        console.warn('⚠️ Unknown role, redirecting to login:', role);
        this.router.navigate(['/login']);
    }
  }

  private handleLoginSuccess(loginData: LoginResponse): void {
    if (loginData.accessToken && loginData.userInfo) {
      localStorage.setItem('accessToken',  loginData.accessToken);
      localStorage.setItem('refreshToken', loginData.refreshToken);
      localStorage.setItem('user',         JSON.stringify(loginData.userInfo));

      this.currentUserSubject.next(loginData.userInfo);

      console.log('✅ Login successful:', {
        userId:     loginData.userInfo.userId,
        role:       loginData.userInfo.role,
        firstLogin: loginData.userInfo.firstLogin
      });
    } else {
      console.error('❌ Invalid login response structure:', loginData);
      throw new Error('Invalid login response');
    }
  }

  private clearStoredData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Note: do NOT remove 'deviceId:<username>' keys here — they should
    // persist so returning users get a stable device fingerprint.
    this.currentUserSubject.next(null);
    console.log('🗑️ Authentication data cleared');
  }

  /**
   * Returns a stable device ID scoped to this username so that two
   * different users on the same browser receive different deviceIds.
   * This prevents the refresh-token unique-constraint collision that
   * occurs when two users share the same deviceId.
   */
  private getOrCreateDeviceId(username: string): string {
    const key      = `deviceId:${username}`;
    let   deviceId = localStorage.getItem(key);
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(key, deviceId);
    }
    return deviceId;
  }

  private getDeviceId(): string | null {
    const user = this.getCurrentUser();
    if (user) {
      return localStorage.getItem(`deviceId:${user.email}`) ||
             localStorage.getItem(`deviceId:${user.userId}`);
    }
    return null;
  }

  private generateDeviceId(): string {
    return 'WEB-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
  }

  private formatError(error: any): any {
    if (error.error?.message) {
      return { message: error.error.message, status: error.status };
    }
    return { message: error.message || 'An error occurred', status: error.status };
  }

  // ── Public getters ────────────────────────────────────────────────────────

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getUserRole(): string | null {
    return this.getCurrentUser()?.role || null;
  }

  requiresFirstLoginPasswordChange(): boolean {
    return this.getCurrentUser()?.firstLogin || false;
  }
}
