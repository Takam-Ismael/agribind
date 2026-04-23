// src/app/core/utils/user-type-guards.ts

import { User } from '../services/user.service';

/**
 * Type guards and helpers for User types
 */

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';
export type UserType = 'FARMER' | 'COOPERATIVE' | 'GOVERNMENT';
export type AgriculturalType = 'CROP' | 'LIVESTOCK' | 'MIXED';

/**
 * Check if a string is a valid user status
 */
export function isValidUserStatus(status: string): status is UserStatus {
  return ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'].includes(status);
}

/**
 * Check if a string is a valid user type
 */
export function isValidUserType(type: string): type is UserType {
  return ['FARMER', 'COOPERATIVE', 'GOVERNMENT'].includes(type);
}

/**
 * Check if a string is a valid agricultural type
 */
export function isValidAgriculturalType(type: string): type is AgriculturalType {
  return ['CROP', 'LIVESTOCK', 'MIXED'].includes(type);
}

/**
 * Convert string to UserStatus with type safety
 */
export function toUserStatus(status: string): UserStatus {
  if (isValidUserStatus(status)) {
    return status;
  }
  return 'ACTIVE'; // default
}

/**
 * Convert string to UserType with type safety
 */
export function toUserType(type: string): UserType {
  if (isValidUserType(type)) {
    return type;
  }
  return 'FARMER'; // default
}

/**
 * Convert string to AgriculturalType with type safety
 */
export function toAgriculturalType(type: string): AgriculturalType {
  if (isValidAgriculturalType(type)) {
    return type;
  }
  return 'CROP'; // default
}

/**
 * Check if user is a farmer
 */
export function isFarmer(user: User): boolean {
  return user.type === 'FARMER';
}

/**
 * Check if user is a cooperative
 */
export function isCooperative(user: User): boolean {
  return user.type === 'COOPERATIVE';
}

/**
 * Check if user is a government official
 */
export function isGovernment(user: User): boolean {
  return user.type === 'GOVERNMENT';
}

/**
 * Check if user is active
 */
export function isUserActive(user: User): boolean {
  return user.status === 'ACTIVE';
}

/**
 * Get user status badge color class
 */
export function getUserStatusClass(status: UserStatus): string {
  const statusMap: Record<UserStatus, string> = {
    'ACTIVE': 'bg-green-100 text-green-800 border-green-200',
    'INACTIVE': 'bg-gray-100 text-gray-800 border-gray-200',
    'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'SUSPENDED': 'bg-red-100 text-red-800 border-red-200',
    'DELETED': 'bg-red-200 text-red-900 border-red-300'
  };
  return statusMap[status] || statusMap['INACTIVE'];
}

/**
 * Get user type badge color class
 */
export function getUserTypeClass(type: UserType): string {
  const typeMap: Record<UserType, string> = {
    'FARMER': 'bg-blue-100 text-blue-800 border-blue-200',
    'COOPERATIVE': 'bg-purple-100 text-purple-800 border-purple-200',
    'GOVERNMENT': 'bg-indigo-100 text-indigo-800 border-indigo-200'
  };
  return typeMap[type] || typeMap['FARMER'];
}

/**
 * Get agricultural type badge color class
 */
export function getAgriculturalTypeClass(type: AgriculturalType): string {
  const typeMap: Record<AgriculturalType, string> = {
    'CROP': 'bg-green-100 text-green-800 border-green-200',
    'LIVESTOCK': 'bg-orange-100 text-orange-800 border-orange-200',
    'MIXED': 'bg-teal-100 text-teal-800 border-teal-200'
  };
  return typeMap[type] || typeMap['CROP'];
}

/**
 * Format user display name
 */
export function formatUserDisplayName(user: User): string {
  if (!user) return '';

  let name = user.name || 'Unknown';

  if (user.type === 'FARMER' && user.agriculturalType) {
    name += ` (${user.agriculturalType})`;
  }

  if (user.type === 'COOPERATIVE' && user.cooperativeType) {
    name += ` (${user.cooperativeType})`;
  }

  if (user.type === 'GOVERNMENT' && user.governmentRole) {
    name += ` (${user.governmentRole})`;
  }

  return name;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return 'N/A';

  // Cameroon phone number formatting
  if (phone.startsWith('+237')) {
    return phone.replace(/(\+237)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }

  // Generic formatting
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

/**
 * Format email for display
 */
export function formatEmail(email: string | undefined): string {
  return email || 'N/A';
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user: User): string {
  if (!user?.name) return 'U';

  const parts = user.name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return user.name.substring(0, 2).toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Cameroon)
 */
export function isValidCameroonPhone(phone: string): boolean {
  // Accepts: +237XXXXXXXXX or 237XXXXXXXXX or 6XXXXXXXX
  const phoneRegex = /^(\+?237)?[6][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Normalize phone number to standard format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // Add +237 prefix if not present for Cameroon numbers
  if (!normalized.startsWith('+') && normalized.startsWith('6')) {
    normalized = '+237' + normalized;
  } else if (normalized.startsWith('237') && !normalized.startsWith('+237')) {
    normalized = '+' + normalized;
  }

  return normalized;
}

/**
 * Get user role display name
 */
export function getUserRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    'FARMER': 'Farmer',
    'COOPERATIVE': 'Cooperative Manager',
    'GOVERNMENT': 'Government Official'
  };
  return roleMap[role] || role;
}

/**
 * Get status display name
 */
export function getStatusDisplayName(status: UserStatus): string {
  const statusMap: Record<UserStatus, string> = {
    'ACTIVE': 'Active',
    'INACTIVE': 'Inactive',
    'PENDING': 'Pending Approval',
    'SUSPENDED': 'Suspended',
    'DELETED': 'Deleted'
  };
  return statusMap[status] || status;
}

/**
 * Sort users by name
 */
export function sortUsersByName(users: User[], ascending: boolean = true): User[] {
  return [...users].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
}

/**
 * Sort users by created date
 */
export function sortUsersByDate(users: User[], ascending: boolean = true): User[] {
  return [...users].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Filter users by type
 */
export function filterUsersByType(users: User[], type: UserType | 'ALL'): User[] {
  if (type === 'ALL') return users;
  return users.filter(user => user.type === type);
}

/**
 * Filter users by status
 */
export function filterUsersByStatus(users: User[], status: UserStatus | 'ALL'): User[] {
  if (status === 'ALL') return users;
  return users.filter(user => user.status === status);
}

/**
 * Search users by term
 */
export function searchUsers(users: User[], searchTerm: string): User[] {
  if (!searchTerm) return users;

  const term = searchTerm.toLowerCase();

  return users.filter(user =>
    user.name.toLowerCase().includes(term) ||
    user.phoneNumber.includes(term) ||
    (user.email && user.email.toLowerCase().includes(term)) ||
    user.userId.toLowerCase().includes(term) ||
    (user.registrationNumber && user.registrationNumber.toLowerCase().includes(term))
  );
}