import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MicrocreditComponent } from './microcredit.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    MicrocreditComponent,
    RouterModule.forChild([
      { path: '', component: MicrocreditComponent }
    ])
  ],
  exports: [MicrocreditComponent]
})
export class MicrocreditModule {}

