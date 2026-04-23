// source-code/agribind-frontend/src/app/modules/auth/login/login.component.ts

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading    = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private fb:          FormBuilder,
    private router:      Router,
    private authService: AuthService
  ) {
    // Already logged in → skip straight to the correct dashboard
    if (this.authService.isLoggedIn()) {
      this.navigateToDashboard();
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    const timestamp = new Date().toISOString();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 LOGIN ATTEMPT:', timestamp);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.errorMessage = '';

    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key =>
        this.loginForm.get(key)?.markAsTouched()
      );
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.isLoading = true;

    const credentials = {
      username: this.loginForm.value.username.trim(),
      password: this.loginForm.value.password
    };

    console.log('📤 REQUEST DETAILS:');
    console.log('   Username:', credentials.username);
    console.log('   Password Length:', credentials.password.length);
    console.log('   API URL: /api/v1/auth/login (proxied)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;

        console.log('✅ LOGIN SUCCESS:', timestamp);
        console.log('   User Role:', response.userInfo.role);
        console.log('   First Login:', response.userInfo.firstLogin);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (response.userInfo.firstLogin) {
          console.log('⚠️ First login detected, redirecting to password change');
          this.router.navigate(['/change-password']);
          return;
        }

        this.navigateToDashboard();
      },

      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ LOGIN FAILED:', timestamp);
        console.error('   Status Code:', error.status);
        console.error('   Status Text:', error.statusText || 'Unknown');
        console.error('   URL:', error.url || 'Unknown URL');
        console.error('   Error Message:', error.message);
        console.error('   Error Object:', error.error);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  /**
   * Route the logged-in user to the correct dashboard based on their role.
   *
   * Route map (must match app.routes.ts exactly):
   *   GOVERNMENT  → /government          (children default to production-monitoring)
   *   COOPERATIVE → /cooperative         (children default to members)
   *   FARMER      → /farmer/dashboard
   */
  private navigateToDashboard(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('❌ No user data available, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('📍 Routing user with role:', user.role);

    switch (user.role.toUpperCase()) {
      case 'GOVERNMENT':
        console.log('📍 Navigating to government dashboard');
        this.router.navigate(['/government']).then(success => {
          if (success) console.log('✅ Navigation successful to /government');
          else         console.error('❌ Navigation failed to /government');
        });
        break;

      case 'COOPERATIVE':
        console.log('📍 Navigating to cooperative dashboard');
        this.router.navigate(['/cooperative']).then(success => {
          if (success) console.log('✅ Navigation successful to /cooperative');
          else         console.error('❌ Navigation failed to /cooperative');
        });
        break;

      case 'FARMER':
        console.log('📍 Navigating to farmer dashboard');
        this.router.navigate(['/farmer/dashboard']);
        break;

      default:
        console.warn('⚠️ Unknown role:', user.role, '→ redirecting to login');
        this.router.navigate(['/login']);
    }
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0)   return 'Cannot connect to server. Please check if the backend is running.';
    if (error.status === 401) return 'Invalid email or password. Please check your credentials.';
    if (error.status === 403) return 'Account is disabled or locked. Please contact support.';
    if (error.status === 400) return 'Invalid login request. Please check your input.';
    if (error.status === 500) return 'An unexpected error occurred. Please try again.';
    if (error.error?.message)       return error.error.message;
    if (error.error?.data?.message) return error.error.data.message;
    return 'An error occurred during login. Please try again.';
  }

  onQRLogin(): void {
    this.router.navigate(['/qr-login']);
  }

  onForgotPassword(): void {
    this.router.navigate(['/change-password']);
  }
}
