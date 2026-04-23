import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductionMonitoringRoutingModule } from './production-monitoring-routing.module';
import { ProductionMonitoringComponent } from './production-monitoring.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ProductionMonitoringRoutingModule,
    ProductionMonitoringComponent
  ],
  exports: [ProductionMonitoringComponent]
})
export class ProductionMonitoringModule {}