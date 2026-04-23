import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TrainingAnnouncementsComponent } from './training-announcements.component';

/**
 * TrainingAnnouncementsModule
 *
 * Self-contained feature module for the Training Announcements page.
 *
 * To use this module in your app:
 *  1. Import it into your AppModule (or any feature module):
 *       imports: [TrainingAnnouncementsModule]
 *
 *  2. Use the component's selector in any template:
 *       <app-training-announcements></app-training-announcements>
 *
 * Dependencies:
 *  - CommonModule   → *ngFor, *ngIf, async pipe, etc.
 *  - FormsModule    → [(ngModel)] two-way data binding
 */
@NgModule({
  declarations: [
    TrainingAnnouncementsComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    TrainingAnnouncementsComponent
  ]
})
export class TrainingAnnouncementsModule {}