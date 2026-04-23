// E:\INGE 4 ISI\Tutorial Project\agribind-platform\source-code\agribind-frontend\src\shared\cooperative-sidebar\cooperative-sidebar.component.ts

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';

@Component({
  selector: 'app-cooperative-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cooperative-sidebar.component.html',
  styleUrls: ['./cooperative-sidebar.component.scss']
})
export class CooperativeSidebarComponent {
  @Output() closeSidebar = new EventEmitter<void>();

  constructor(
    public router: Router,
    private authService: AuthService
  ) {}

  onClose(): void {
    this.closeSidebar.emit();
  }

  onNavigate(route: string): void {
    console.log('🧭 Navigating to:', route);
    this.router.navigate([route]);
    this.closeSidebar.emit(); // Close sidebar on mobile after navigation
  }

  onLogout(): void {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
      console.log('🚪 Logging out user...');
      this.authService.logout();
      // Router navigation is handled in AuthService.logout()
    }
  }
}