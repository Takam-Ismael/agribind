// src/app/core/services/user.service.ts - Complete Interface

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';

// Enums
export enum UserType {
  FARMER = 'FARMER',
  COOPERATIVE = 'COOPERATIVE',
  GOVERNMENT = 'GOVERNMENT'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

export enum Region {
  ADAMAOUA = 'ADAMAOUA',
  CENTRE = 'CENTRE',
  EST = 'EST',
  EXTREME_NORD = 'EXTREME_NORD',
  LITTORAL = 'LITTORAL',
  NORD = 'NORD',
  NORD_OUEST = 'NORD_OUEST',
  OUEST = 'OUEST',
  SUD = 'SUD',
  SUD_OUEST = 'SUD_OUEST'
}

// User Interface
export interface User {
  id?: string;
  userId: string;
  name: string;
  email?: string;
  phoneNumber: string;
  type: UserType;
  status: UserStatus;
  registrationNumber?: string;
  region?: Region;
  department?: string;
  district?: string;
  village?: string;
  gpsCoordinates?: string;
  preferredLanguage?: string;
  createdAt?: string;
  updatedAt?: string;

  // Type-specific fields
  farmerDetails?: FarmerDetails;
  cooperativeDetails?: CooperativeDetails;
  governmentDetails?: GovernmentDetails;
}

export interface FarmerDetails {
  agriculturalType?: string;
  cropTypes?: string[];
  livestockTypes?: string[];
  totalLandArea?: number;
  cultivatedArea?: number;
  cooperativeId?: string;
  cooperativeName?: string;
}

export interface CooperativeDetails {
  cooperativeType?: string;
  legalRegistrationNumber?: string;
  establishmentYear?: number;
  contactPerson?: string;
  totalMembers?: number;
  activeMemberCount?: number;
}

export interface GovernmentDetails {
  role?: string;
  assignedRegion?: string;
  department?: string;
  employeeId?: string;
}

// Create User Command
export interface CreateUserCommand {
  type: UserType | string;
  name: string;
  email?: string;
  phoneNumber: string;
  region?: Region | string;
  department?: string;
  district?: string;
  village?: string;
  gpsCoordinates?: string;
  preferredLanguage?: string;

  // Farmer fields
  agriculturalType?: string;
  cropTypes?: string[];
  livestockTypes?: string[];
  landArea?: number;
  cooperativeId?: string;

  // Cooperative fields
  cooperativeType?: string;
  legalRegistrationNumber?: string;
  establishmentYear?: number;
  contactPerson?: string;

  // Government fields
  governmentRole?: string;
  employeeId?: string;
}

// Page Response
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiClient: ApiClientService) {}

  /**
   * Get paginated users with filters
   */
  getUsers(page: number = 0, size: number = 10, filters: any = {}): Observable<PageResponse<User>> {
    const params = {
      page: page.toString(),
      size: size.toString(),
      ...filters
    };

    return this.apiClient.get<PageResponse<User>>('/api/v1/users', params);
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): Observable<User> {
    return this.apiClient.get<User>(`/api/v1/users/${userId}`);
  }

  /**
   * Get user by phone number
   */
  getUserByPhone(phoneNumber: string): Observable<User> {
    return this.apiClient.get<User>(`/api/v1/users/phone/${phoneNumber}`);
  }

  /**
   * Get user by registration number
   */
  getUserByRegistration(registrationNumber: string): Observable<User> {
    return this.apiClient.get<User>(`/api/v1/users/registration/${registrationNumber}`);
  }

  /**
   * Create new user
   */
  createUser(command: CreateUserCommand): Observable<User> {
    return this.apiClient.post<User>('/api/v1/users', command);
  }

  /**
   * Update user
   */
  updateUser(userId: string, updates: Partial<CreateUserCommand>): Observable<User> {
    return this.apiClient.put<User>(`/api/v1/users/${userId}`, updates);
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, status: UserStatus): Observable<User> {
    return this.apiClient.patch<User>(
      `/api/v1/users/${userId}/status?status=${status}`,
      {}
    );
  }

  /**
   * Delete user (soft delete)
   */
  deleteUser(userId: string): Observable<void> {
    return this.apiClient.delete<void>(`/api/v1/users/${userId}`);
  }

  /**
   * Check if phone exists
   */
  checkPhoneExists(phoneNumber: string): Observable<boolean> {
    return this.apiClient.get<boolean>(`/api/v1/users/exists/phone/${phoneNumber}`);
  }

  /**
   * Check if email exists
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.apiClient.get<boolean>(`/api/v1/users/exists/email/${email}`);
  }

  /**
   * Export users to file
   */
  exportUsers(format: 'CSV' | 'EXCEL' | 'PDF', filters: any = {}): Observable<Blob> {
    const exportQuery = {
      format,
      ...filters
    };

    return this.apiClient.post<Blob>('/api/v1/exports/generate', exportQuery);
  }

  /**
   * Get farmers only
   */
  getFarmers(page: number = 0, size: number = 10): Observable<PageResponse<User>> {
    return this.getUsers(page, size, { type: UserType.FARMER });
  }

  /**
   * Get cooperatives only
   */
  getCooperatives(page: number = 0, size: number = 10): Observable<PageResponse<User>> {
    return this.getUsers(page, size, { type: UserType.COOPERATIVE });
  }

  /**
   * Get government officials only
   */
  getGovernmentOfficials(page: number = 0, size: number = 10): Observable<PageResponse<User>> {
    return this.getUsers(page, size, { type: UserType.GOVERNMENT });
  }
}

// QR Code Service Interface
export interface QRCodeResponse {
  userId: string;
  purpose: string;
  qrCodeImage: string;
  qrCodeData: string;
  downloadUrl?: string;
  size?: number;
  format?: string;
  expiresAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QRCodeService {
  constructor(private apiClient: ApiClientService) {}

  /**
   * Generate QR code for registration
   */
  generateRegistrationQRCode(userId: string): Observable<QRCodeResponse> {
    return this.apiClient.get<QRCodeResponse>(`/api/v1/qrcodes/${userId}/registration`);
  }

  /**
   * Generate QR code for login
   */
  generateLoginQRCode(userId: string): Observable<QRCodeResponse> {
    return this.apiClient.get<QRCodeResponse>(`/api/v1/qrcodes/${userId}/login`);
  }

  /**
   * Generate QR code for profile
   */
  generateProfileQRCode(userId: string): Observable<QRCodeResponse> {
    return this.apiClient.get<QRCodeResponse>(`/api/v1/qrcodes/${userId}/profile`);
  }

  /**
   * Validate QR code
   */
  validateQRCode(qrData: string): Observable<User> {
    // ApiClientService.post accepts only (endpoint, data), so send qrData in the request body
    return this.apiClient.post<User>('/api/v1/qrcodes/validate', { qrData });
  }

  /**
   * Download QR code
   */
  downloadQRCode(userId: string, purpose: string = 'REGISTRATION'): Observable<Blob> {
    return this.apiClient.get<Blob>(
      `/api/v1/qrcodes/${userId}/download`,
      { purpose, size: '300', format: 'PNG' }
    );
  }
}