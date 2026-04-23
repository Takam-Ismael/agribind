import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { GovernmentSidebarComponent } from '../../../../../shared/government-sidebar/government-sidebar.component';

@Component({
  selector: 'app-government-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, GovernmentSidebarComponent],
  templateUrl: './government-dashboard.component.html',
  styleUrl: './government-dashboard.component.scss'
})
export class GovernmentDashboardComponent implements OnInit {
  currentUser: any;
  sidebarOpen = false;
  pageTitle = '';

  private readonly routeTitles: Record<string, string> = {
    'production-monitoring':  'Production Monitoring',
    'national-overview':      'National Overview',
    'set-market-prices':      'Set Market Prices',
    'training-announcements': 'Training Announcements',
    'reports-analytics':      'Reports & Analytics',
    'system-settings':        'System Settings',
    'cooperative-management': 'Cooperative Management',
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Auth check (keep your existing logic)
    // if (!this.authService.isLoggedIn()) {
    //   this.router.navigate(['/login']);
    //   return;
    // }

    this.currentUser = this.authService.getCurrentUser();

    // if (!this.currentUser) {
    //   this.authService.logout();
    //   return;
    // }

    console.log('✅ Government dashboard loaded for:', this.currentUser?.username);

    // Set title on first load
    this.updateTitle(this.router.url);

    // Update title on every navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.updateTitle(e.urlAfterRedirects));
  }

  private updateTitle(url: string): void {
    const segment = url.split('/').pop()?.split('?')[0] ?? '';
    this.pageTitle = this.routeTitles[segment] ?? '';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}