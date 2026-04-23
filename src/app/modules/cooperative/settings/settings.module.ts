import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    SettingsComponent,
    RouterModule.forChild([
      { path: '', component: SettingsComponent }
    ])
  ],
  exports: [SettingsComponent]
})
export class SettingsModule {}

