import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsAnalyticsComponent } from './report-analytics.component';

const routes: Routes = [
  {
    path: '',
    component: ReportsAnalyticsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsAnalyticsRoutingModule {}