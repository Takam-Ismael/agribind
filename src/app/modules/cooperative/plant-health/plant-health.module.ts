import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlantHealthComponent } from './plant-health.component';

@NgModule({
  declarations: [], // use standalone
  imports: [
    CommonModule,
    FormsModule,
    PlantHealthComponent,
    RouterModule.forChild([
      { path: '', component: PlantHealthComponent }
    ])
  ],
  exports: [PlantHealthComponent]
})
export class PlantHealthModule {}

