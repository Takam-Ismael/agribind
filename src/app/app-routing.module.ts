import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'cooperative',
    loadChildren: () => import('./modules/cooperative/cooperative.module').then(m => m.CooperativeModule)
  },
  {
    path: 'inventory',
    loadChildren: () => import('./modules/cooperative/inventory/inventory.routes')
      .then(m => m.inventoryRoutes)
  },
  {
    path: 'government',
    loadChildren: () => import('./modules/government/dashboard/government-dashboard/government-dashboard.module')
      .then(m => m.GovernmentDashboardModule)
  },
  {
    path: '',
    redirectTo: '/cooperative',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/cooperative'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }