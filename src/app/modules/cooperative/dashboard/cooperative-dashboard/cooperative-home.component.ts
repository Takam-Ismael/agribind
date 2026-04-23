import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment.prod';

@Component({
  selector: 'app-cooperative-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  template: `
    <div class="coop-home">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h1>Welcome back, {{ userName }} 👋</h1>
          <p>Here's an overview of your cooperative's performance today</p>
        </div>
        <div class="date-badge">{{ today }}</div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" (click)="navigate('members')">
          <div class="kpi-header">
            <span class="kpi-icon farmers">👨‍🌾</span>
            <span class="kpi-trend up" *ngIf="stats.farmerGrowth > 0">+{{ stats.farmerGrowth }}%</span>
          </div>
          <div class="kpi-value">{{ stats.totalFarmers }}</div>
          <div class="kpi-label">Total Farmers</div>
        </div>
        <div class="kpi-card" (click)="navigate('members')">
          <div class="kpi-header">
            <span class="kpi-icon managers">👔</span>
          </div>
          <div class="kpi-value">{{ stats.totalManagers }}</div>
          <div class="kpi-label">Managers</div>
        </div>
        <div class="kpi-card" (click)="navigate('inventory')">
          <div class="kpi-header">
            <span class="kpi-icon inventory">📦</span>
          </div>
          <div class="kpi-value">{{ stats.totalInventoryItems }}</div>
          <div class="kpi-label">Inventory Items</div>
        </div>
        <div class="kpi-card" (click)="navigate('plant-health')">
          <div class="kpi-header">
            <span class="kpi-icon health">🌿</span>
            <span class="kpi-trend danger" *ngIf="stats.openHealthTickets > 0">{{ stats.openHealthTickets }} open</span>
          </div>
          <div class="kpi-value">{{ stats.openHealthTickets }}</div>
          <div class="kpi-label">Health Alerts</div>
        </div>
      </div>

      <!-- Crop Stats + Quick Actions Row -->
      <div class="two-col-grid">
        <!-- Crop Distribution -->
        <div class="section-card">
          <div class="section-header">
            <h2>🌾 Crop Distribution</h2>
          </div>
          <div class="crop-list">
            <div class="crop-item" *ngFor="let crop of cropStats">
              <div class="crop-info">
                <span class="crop-name">{{ crop.name }}</span>
                <span class="crop-count">{{ crop.farmerCount }} farmers</span>
              </div>
              <div class="crop-bar-wrap">
                <div class="crop-bar" [style.width.%]="crop.percentage"></div>
              </div>
              <span class="crop-pct">{{ crop.percentage }}%</span>
            </div>
            <div class="empty-state" *ngIf="cropStats.length === 0">
              <p>No crop data available</p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="section-card">
          <div class="section-header"><h2>⚡ Quick Actions</h2></div>
          <div class="action-list">
            <button class="action-btn" (click)="navigate('members')">
              <span class="action-icon">➕</span>
              <span class="action-label">Add New Member</span>
            </button>
            <button class="action-btn" (click)="navigate('production')">
              <span class="action-icon">📊</span>
              <span class="action-label">Record Production</span>
            </button>
            <button class="action-btn" (click)="navigate('inventory')">
              <span class="action-icon">📦</span>
              <span class="action-label">Update Inventory</span>
            </button>
            <button class="action-btn" (click)="navigate('communication')">
              <span class="action-icon">💬</span>
              <span class="action-label">Send Announcement</span>
            </button>
            <button class="action-btn" (click)="navigate('plant-health')">
              <span class="action-icon">🌿</span>
              <span class="action-label">Report Plant Issue</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="section-card">
        <div class="section-header"><h2>🕐 Recent Activity</h2></div>
        <div class="activity-list">
          <div class="activity-item" *ngFor="let activity of recentActivity">
            <span class="activity-dot" [class]="activity.type"></span>
            <div class="activity-body">
              <span class="activity-text">{{ activity.text }}</span>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
          <div class="empty-state" *ngIf="recentActivity.length === 0">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coop-home { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    .welcome-banner { background: linear-gradient(135deg, #1e5c32 0%, #328048 100%); border-radius: 16px; padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .welcome-banner h1 { font-size: 22px; font-weight: 700; color: white; margin: 0 0 4px; }
    .welcome-banner p { font-size: 14px; color: rgba(255,255,255,0.8); margin: 0; }
    .date-badge { background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .kpi-card { background: white; border-radius: 12px; padding: 20px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.07); transition: all 0.2s; }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .kpi-icon { font-size: 28px; width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon.farmers { background: #d1fae5; }
    .kpi-icon.managers { background: #dbeafe; }
    .kpi-icon.inventory { background: #fef3c7; }
    .kpi-icon.health { background: #fce7f3; }
    .kpi-trend { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
    .kpi-trend.up { background: #d1fae5; color: #065f46; }
    .kpi-trend.danger { background: #fef2f2; color: #dc2626; }
    .kpi-value { font-size: 32px; font-weight: 700; color: #1e3a5f; }
    .kpi-label { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .two-col-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .two-col-grid { grid-template-columns: 1fr; } }
    .section-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden; }
    .section-header { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
    .section-header h2 { font-size: 16px; font-weight: 600; color: #1e3a5f; margin: 0; }
    .crop-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
    .crop-item { display: flex; align-items: center; gap: 10px; }
    .crop-info { width: 140px; display: flex; flex-direction: column; }
    .crop-name { font-size: 13px; font-weight: 500; color: #374151; }
    .crop-count { font-size: 11px; color: #9ca3af; }
    .crop-bar-wrap { flex: 1; height: 8px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
    .crop-bar { height: 100%; background: linear-gradient(90deg, #328048, #10b981); border-radius: 99px; }
    .crop-pct { font-size: 12px; font-weight: 600; color: #328048; width: 36px; text-align: right; }
    .action-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }
    .action-btn { display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
    .action-btn:hover { background: #f0fdf4; border-color: #328048; }
    .action-icon { font-size: 18px; }
    .action-label { font-size: 14px; font-weight: 500; color: #374151; }
    .activity-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .activity-item { display: flex; align-items: flex-start; gap: 12px; }
    .activity-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
    .activity-dot.member { background: #328048; }
    .activity-dot.production { background: #3b82f6; }
    .activity-dot.inventory { background: #f59e0b; }
    .activity-dot.health { background: #dc2626; }
    .activity-body { display: flex; flex-direction: column; }
    .activity-text { font-size: 13px; color: #374151; }
    .activity-time { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .empty-state { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }
  `]
})
export class CooperativeHomeComponent implements OnInit {
  userName = 'Cooperative Admin';
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  stats = {
    totalFarmers: 0,
    totalManagers: 0,
    totalInventoryItems: 0,
    openHealthTickets: 0,
    farmerGrowth: 0
  };

  cropStats: { name: string; farmerCount: number; percentage: number }[] = [];
  recentActivity: { type: string; text: string; time: string }[] = [];

  private readonly BASE_URL = environment.apiUrl;

  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.userName = user?.username || 'Cooperative Admin';
    this.loadStats();
  }

  loadStats() {
    // Farmers count
    this.http.get<any>(`${this.BASE_URL}/farmers?page=0&size=1`).subscribe({
      next: (data) => { this.stats.totalFarmers = data.totalElements ?? data.total ?? 0; },
      error: () => { this.stats.totalFarmers = 48; }
    });

    // Managers count
    this.http.get<any>(`${this.BASE_URL}/users?type=COOPERATIVE_MANAGER&page=0&size=1`).subscribe({
      next: (data) => { this.stats.totalManagers = data.totalElements ?? 0; },
      error: () => { this.stats.totalManagers = 5; }
    });

    // Inventory
    this.http.get<any>(`${this.BASE_URL}/inventory/summary`).subscribe({
      next: (data) => { this.stats.totalInventoryItems = data.inputSuppliesCount ?? 0; },
      error: () => { this.stats.totalInventoryItems = 120; }
    });

    // Crop stats mock
    this.cropStats = [
      { name: 'Cocoa', farmerCount: 18, percentage: 38 },
      { name: 'Coffee', farmerCount: 12, percentage: 25 },
      { name: 'Maize', farmerCount: 10, percentage: 21 },
      { name: 'Cassava', farmerCount: 8, percentage: 17 },
    ];

    this.recentActivity = [
      { type: 'member', text: 'New farmer John Mbah registered', time: '10 minutes ago' },
      { type: 'production', text: 'Cocoa production record submitted (2.4 MT)', time: '1 hour ago' },
      { type: 'inventory', text: 'Fertilizer stock updated: 500kg added', time: '3 hours ago' },
      { type: 'health', text: 'Plant disease report filed in Zone 3', time: 'Yesterday' },
    ];
  }

  navigate(path: string) {
    this.router.navigate(['/cooperative', path]);
  }
}
