import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryComponent } from './inventory.component';
import { InventoryDashboardComponent } from './inventory-dashboard/inventory-dashboard.component';
import { InventoryListComponent } from './inventory-list/inventory-list.component';

@NgModule({
  declarations: [],  // Leave empty - don't declare standalone components
  imports: [
    CommonModule,
    FormsModule,
    // Import the standalone components here
    InventoryComponent,
    InventoryDashboardComponent,
    InventoryListComponent,
    RouterModule.forChild([
      { path: '', component: InventoryComponent }
    ])
  ],
  exports: [InventoryComponent]  // Export if needed by parent modules
})
export class InventoryModule {}