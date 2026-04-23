import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CommunicationRoutingModule } from './communication-routing.module';
import { CommunicationDashboardComponent } from './communication-dashboard/communication-dashboard.component';

/**
 * CommunicationModule — feature module for the cooperative communication centre.
 *
 * CommunicationDashboardComponent is standalone, so it lives in imports[].
 * The routing is handled by CommunicationRoutingModule (lazy-loaded child routes).
 *
 * Typical lazy-load entry in app-routing.module.ts:
 *
 *   {
 *     path: 'communication',
 *     loadChildren: () =>
 *       import('./modules/cooperative/communication/communication.module')
 *         .then(m => m.CommunicationModule)
 *   }
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    CommunicationRoutingModule,
    CommunicationDashboardComponent        // standalone — imported, not declared
  ]
})
export class CommunicationModule { }
