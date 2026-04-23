// E:\INGE 4 ISI\Tutorial Project\agribind-platform\source-code\agribind-frontend\src\app\modules\cooperative\dashboard\cooperative-dashboard\cooperative-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CooperativeSidebarComponent } from '../../../../../shared/cooperative-sidebar/cooperative-sidebar.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-cooperative-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CooperativeSidebarComponent],
  templateUrl: './cooperative-dashboard.component.html',
  styleUrls: ['./cooperative-dashboard.component.scss']
})
export class CooperativeDashboardComponent implements OnInit {
  currentUser: any;
  sidebarOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check authentication
    if (!this.authService.isLoggedIn()) {
      console.log('❌ User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Get current user
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      console.log('❌ No user data found, redirecting to login');
      this.authService.logout();
      return;
    }

    // Verify user role
    if (this.currentUser.role !== 'COOPERATIVE') {
      console.log('❌ User is not a cooperative, redirecting to appropriate dashboard');
      this.redirectToRoleDashboard(this.currentUser.role);
      return;
    }

    console.log('✅ Cooperative dashboard loaded for:', this.currentUser.username);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  private redirectToRoleDashboard(role: string): void {
    switch (role.toUpperCase()) {
      case 'FARMER':
        this.router.navigate(['/farmer/dashboard']);
        break;
      case 'GOVERNMENT':
        this.router.navigate(['/government/production-monitoring']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}