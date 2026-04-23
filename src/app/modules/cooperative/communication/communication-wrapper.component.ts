import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunicationDashboardComponent } from './communication-dashboard/communication-dashboard.component';

/**
 * CommunicationWrapperComponent
 *
 * Thin shell that hosts the dashboard. Useful if you ever need to add
 * guards, breadcrumbs, or a layout frame around the communication feature
 * without touching the dashboard component itself.
 *
 * NOTE: This component is NOT used by the router directly.
 * The router points to CommunicationDashboardComponent.
 * Use this wrapper only if you switch the route to load this shell instead.
 */
@Component({
  selector: 'app-communication-wrapper',
  standalone: true,
  imports: [CommonModule, CommunicationDashboardComponent],
  template: `<app-communication-dashboard></app-communication-dashboard>`
})
export class CommunicationWrapperComponent {}
