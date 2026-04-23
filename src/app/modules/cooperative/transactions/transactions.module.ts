import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionsComponent } from './transactions.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    TransactionsComponent,
    RouterModule.forChild([
      { path: '', component: TransactionsComponent }
    ])
  ],
  exports: [TransactionsComponent]
})
export class TransactionsModule {}

