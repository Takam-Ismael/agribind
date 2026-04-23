// src/app/modules/government/cooperative-management/cooperative-management.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CooperativeManagementComponent } from './cooperative-management.component';

const routes: Routes = [
  {
    path: '',
    component: CooperativeManagementComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CooperativeManagementComponent  // standalone component
  ]
})
export class CooperativeManagementModule { }