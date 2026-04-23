import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CooperativeDashboardComponent } from './dashboard/cooperative-dashboard/cooperative-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: CooperativeDashboardComponent,
    children: [
      {
        path: 'members',
        loadChildren: () => import('./members/members.module').then(m => m.MembersModule)
      },
      {
        path: 'communication',
        loadComponent: () => import('./communication/communication-wrapper.component').then(c => c.CommunicationWrapperComponent)
      },
      {
        path: 'production',
        loadChildren: () => import('./production/production.module').then(m => m.ProductionModule)
      },
      { path: '', redirectTo: 'members', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CooperativeRoutingModule { }
