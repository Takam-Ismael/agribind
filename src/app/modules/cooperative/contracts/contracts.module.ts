import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContractsComponent } from './contracts.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ContractsComponent,
    RouterModule.forChild([
      { path: '', component: ContractsComponent }
    ])
  ],
  exports: [ContractsComponent]
})
export class ContractsModule {}

