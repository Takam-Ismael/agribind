// Trigger angular compile
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.scss'
})
export class SystemSettingsComponent implements OnInit {

  activeTab: 'general' | 'notifications' | 'security' = 'general';
  
  settings = {
    platformName: 'Agribind Cameroon',
    contactEmail: 'support@agribind.cm',
    maintenanceMode: false,
    allowRegistration: true,
    
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    
    twoFactorAuth: false,
    sessionTimeout: '30'
  };

  isSaving = false;
  successMessage = '';

  ngOnInit() {}

  switchTab(tab: 'general' | 'notifications' | 'security') {
    this.activeTab = tab;
  }

  saveSettings() {
    this.isSaving = true;
    this.successMessage = '';
    
    // Simulate API call
    setTimeout(() => {
      this.isSaving = false;
      this.successMessage = 'System settings updated successfully!';
      setTimeout(() => this.successMessage = '', 4000);
    }, 1200);
  }
}