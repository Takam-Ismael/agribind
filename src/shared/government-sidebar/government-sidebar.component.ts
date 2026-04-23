import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../app/core/services/auth.service';

@Component({
  selector: 'app-government-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './government-sidebar.component.html',
  styleUrl: './government-sidebar.component.scss'
})
export class GovernmentSidebarComponent implements OnInit {

  @Input()  isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  activeRoute = '';

  // Derived from current user
  userName     = 'Government User';
  userRole     = 'Agricultural Officer';
  userInitials = 'GU';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Populate user info
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName     = user.username ?? 'Government User';
      this.userRole     = user.role ?? 'Agricultural Officer';
      this.userInitials = this.buildInitials(this.userName);
    }

    // Track active route
    this.activeRoute = this.router.url;
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeRoute = event.urlAfterRedirects;
      });
  }

  isActive(route: string): boolean {
    return this.activeRoute.includes(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
    // Auto-close on mobile after navigation
    this.closeSidebar.emit();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ── Helpers ────────────────────────────────────────────────────────
  private buildInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');
  }
}
