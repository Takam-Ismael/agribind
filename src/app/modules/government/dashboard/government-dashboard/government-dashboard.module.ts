import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SetMarketPricesComponent } from './../../set-market-prices/set-market-prices.component';
import { TrainingAnnouncementsComponent } from './../../training-announcements/training-announcements.component'; // <-- add this

const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('../../production-monitoring/production-monitoring.module')
        .then(m => m.ProductionMonitoringModule)
  },
  {
    path: 'set-market-prices',
    component: SetMarketPricesComponent
  },
  {
    path: 'training-announcements',          // <-- add this route
    component: TrainingAnnouncementsComponent
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    SetMarketPricesComponent,
    TrainingAnnouncementsComponent    // <-- add here
  ],
  imports: [
    CommonModule,    // provides number, date pipes
    FormsModule,     // provides ngModel
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class GovernmentDashboardModule { }