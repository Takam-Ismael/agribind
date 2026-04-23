import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CommunicationDashboardComponent } from './communication-dashboard/communication-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: CommunicationDashboardComponent
  },
  {
    path: 'dashboard',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  // CommunicationDashboardComponent is standalone: true
  // → it MUST go in imports[], never in declarations[]
  imports: [
    RouterModule.forChild(routes),
    CommunicationDashboardComponent        // ← standalone component imported here
  ],
  exports: [
    RouterModule
  ]
})
export class CommunicationRoutingModule { }
