// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./modules/auth/change-password/change-password.component').then(c => c.ChangePasswordComponent),
    canActivate: [authGuard]
  },

  // Cooperative routes (protected)
  {
    path: 'cooperative',
    loadComponent: () => import('./modules/cooperative/dashboard/cooperative-dashboard/cooperative-dashboard.component').then(c => c.CooperativeDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['COOPERATIVE', 'COOPERATIVE_MANAGER'] },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./modules/cooperative/dashboard/cooperative-dashboard/cooperative-home.component').then(c => c.CooperativeHomeComponent)
      },
      {
        path: 'members',
        loadComponent: () => import('./modules/cooperative/members/member-list/member-list.component').then(c => c.MemberListComponent)
      },
      {
        path: 'production',
        loadComponent: () => import('./modules/cooperative/production/production.component').then(c => c.ProductionComponent)
      },
      {
        path: 'communication',
        loadComponent: () => import('./modules/cooperative/communication/communication-wrapper.component').then(c => c.CommunicationWrapperComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./modules/cooperative/inventory/inventory.component').then(c => c.InventoryComponent)
      },
      {
        path: 'plant-health',
        loadComponent: () => import('./modules/cooperative/plant-health/plant-health.component').then(c => c.PlantHealthComponent)
      },
      {
        path: 'contracts',
        loadComponent: () => import('./modules/cooperative/contracts/contracts.component').then(c => c.ContractsComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./modules/cooperative/transactions/transactions.component').then(c => c.TransactionsComponent)
      },
      {
        path: 'microcredit',
        loadComponent: () => import('./modules/cooperative/microcredit/microcredit.component').then(c => c.MicrocreditComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./modules/cooperative/settings/settings.component').then(c => c.SettingsComponent)
      }
    ]
  },

  // Government routes (protected) — guards re-enabled
  {
    path: 'government',
    loadComponent: () => import('./modules/government/dashboard/government-dashboard/government-dashboard.component')
      .then(c => c.GovernmentDashboardComponent),
    canActivate: [authGuard, roleGuard],        // ← re-enabled
    data: { roles: ['GOVERNMENT'] },            // ← re-enabled
    children: [
      { path: '', redirectTo: 'production-monitoring', pathMatch: 'full' },
      {
        path: 'production-monitoring',
        loadComponent: () => import('./modules/government/production-monitoring/production-monitoring.component')
          .then(c => c.ProductionMonitoringComponent)
      },
      {
        path: 'national-overview',
        loadComponent: () => import('./modules/government/national-overview/national-overview.component')
          .then(c => c.NationalOverviewComponent)
      },
      {
        path: 'set-market-prices',
        loadComponent: () => import('./modules/government/set-market-prices/set-market-prices.component')
          .then(c => c.SetMarketPricesComponent)
      },
      {
        path: 'training-announcements',
        loadComponent: () => import('./modules/government/training-announcements/training-announcements.component')
          .then(c => c.TrainingAnnouncementsComponent)
      },
      {
        path: 'reports-analytics',
        loadComponent: () => import('./modules/government/report-analytics/report-analytics.component')
          .then(c => c.ReportsAnalyticsComponent)
      },
      {
        path: 'system-settings',
        loadComponent: () => import('./modules/government/system-settings/system-settings.component')
          .then(c => c.SystemSettingsComponent)
      },
      {
        path: 'cooperative-management',
        loadComponent: () => import('./modules/government/cooperative-management/cooperative-management.component')
          .then(c => c.CooperativeManagementComponent)
      }
    ]
  },

  // Unauthorized
  {
    path: 'unauthorized',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // Default: unauthenticated users land on login
 { path: '', redirectTo: '/cooperative/members', pathMatch: 'full' },
{ path: '**', redirectTo: '/cooperative/members' }
];
