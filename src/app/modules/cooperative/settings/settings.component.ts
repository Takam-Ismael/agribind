import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements OnInit {
  user = {
    name: '',
    role: '',
    initials: '',
    cooperativeId: ''
  };

  settings = {
    // General Settings
    cooperativeName: 'AgriBind Cooperative',
    email: 'info@agribind.coop',
    phone: '+237 6XX XXX XXX',
    address: 'Douala, Cameroon',
    website: '',
    taxId: '',
    registrationNumber: '',

    // System Preferences
    language: 'en',
    currency: 'XAF',
    timezone: 'Africa/Douala',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',

    // Business Settings
    defaultTaxRate: 19.25,
    defaultProfitMargin: 15,
    defaultPaymentTerms: 30,
    minimumOrderValue: 10000,
    autoApproveOrders: false,

    // Notification Settings
    notifications: {
      email: true,
      sms: false,
      push: true,
      orderConfirmations: true,
      paymentReminders: true,
      lowStockAlerts: true,
      diseaseReports: true,
      contractRenewals: true
    },

    // Security Settings
    sessionTimeout: 30,
    passwordMinLength: 8,
    twoFactorAuth: false,
    ipWhitelist: false,

    // Integration Settings
    apiEnabled: false,
    webhookUrl: '',
    smsProvider: 'none',
    emailProvider: 'smtp',

    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,

    // Advanced Settings
    debugMode: false,
    maintenanceMode: false,
    featureFlags: {
      advancedAnalytics: true,
      bulkOperations: true,
      customReports: false
    }
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      let cooperativeId = currentUser.cooperativeId;
      if (!cooperativeId && currentUser.role === 'COOPERATIVE') {
        cooperativeId = currentUser.userId;
      }
      this.user = {
        name: currentUser.username || currentUser.email || 'User',
        role: this.formatRole(currentUser.role),
        initials: this.getInitials(currentUser.username || currentUser.email || 'User'),
        cooperativeId: cooperativeId || ''
      };
    }
  }

  formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'COOPERATIVE': 'Cooperative Manager',
      'FARMER': 'Farmer',
      'GOVERNMENT': 'Government Official'
    };
    return roleMap[role] || role;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  saveSettings(): void {
    console.log('Saving settings:', this.settings);
  }
}
