import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CooperativeDashboardComponent } from './dashboard/cooperative-dashboard/cooperative-dashboard.component';
import { CooperativeRoutingModule } from './cooperative-routing.module';

@NgModule({
  declarations: [], // Empty declarations
  imports: [
    CommonModule,
    RouterModule,
    CooperativeRoutingModule,
    CooperativeDashboardComponent // Import standalone component
  ]
})
export class CooperativeModule { }
