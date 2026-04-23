import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProductionMonitoringComponent } from './production-monitoring.component';

const routes: Routes = [
  {
    path: '',
    component: ProductionMonitoringComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductionMonitoringRoutingModule {}