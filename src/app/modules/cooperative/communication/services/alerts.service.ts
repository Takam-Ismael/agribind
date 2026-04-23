import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Alert, AlertType, AlertPriority, AlertChannel, AlertStatus } from '../models/models/alert.model';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
  private alerts: Alert[] = [
    {
      id: 'ALERT-001',
      type: AlertType.WEATHER,
      priority: AlertPriority.CRITICAL,
      title: 'Heavy Rainfall Warning',
      description: 'Severe weather warnings for northern regions',
      recipients: 450,
      regions: ['North Region', 'Central Region'],
      channels: [AlertChannel.SMS, AlertChannel.PUSH, AlertChannel.VOICE],
      deliveryRate: 95.2,
      date: new Date('2024-01-10'),
      status: AlertStatus.ACTIVE,
      createdBy: 'admin'
    },
    {
      id: 'ALERT-002',
      type: AlertType.PAYMENT,
      priority: AlertPriority.HIGH,
      title: 'Loan Due Notification',
      description: 'Loan payment due in 3 days',
      recipients: 120,
      regions: ['All Regions'],
      channels: [AlertChannel.SMS, AlertChannel.EMAIL],
      deliveryRate: 89.5,
      date: new Date('2024-01-09'),
      status: AlertStatus.SENT,
      createdBy: 'finance'
    },
    {
      id: 'ALERT-003',
      type: AlertType.PRICE,
      priority: AlertPriority.MEDIUM,
      title: 'Market Price Alert',
      description: 'Cassava prices dropped by 15%',
      recipients: 320,
      regions: ['South Region', 'East Region'],
      channels: [AlertChannel.SMS, AlertChannel.PUSH],
      deliveryRate: 92.8,
      date: new Date('2024-01-08'),
      status: AlertStatus.SENT,
      createdBy: 'market'
    },
    {
      id: 'ALERT-004',
      type: AlertType.WEATHER,
      priority: AlertPriority.HIGH,
      title: 'Drought Warning',
      description: 'Low rainfall expected for next 2 weeks',
      recipients: 280,
      regions: ['West Region'],
      channels: [AlertChannel.SMS, AlertChannel.VOICE],
      deliveryRate: 91.3,
      date: new Date('2024-01-07'),
      status: AlertStatus.SENT,
      createdBy: 'admin'
    },
    {
      id: 'ALERT-005',
      type: AlertType.PAYMENT,
      priority: AlertPriority.MEDIUM,
      title: 'Fertilizer Subsidy Reminder',
      description: 'Last day to apply for fertilizer subsidy',
      recipients: 180,
      regions: ['All Regions'],
      channels: [AlertChannel.SMS, AlertChannel.PUSH, AlertChannel.EMAIL],
      deliveryRate: 94.7,
      date: new Date('2024-01-06'),
      status: AlertStatus.ACTIVE,
      createdBy: 'agriculture'
    }
  ];

  constructor() {}

  getAllAlerts(): Observable<Alert[]> {
    return of(this.alerts);
  }

  getAlertById(id: string): Observable<Alert | undefined> {
    return of(this.alerts.find(alert => alert.id === id));
  }

  getAlertsByStatus(status: AlertStatus): Observable<Alert[]> {
    return of(this.alerts.filter(alert => alert.status === status));
  }

  getAlertsByType(type: AlertType): Observable<Alert[]> {
    return of(this.alerts.filter(alert => alert.type === type));
  }

  getAlertsByPriority(priority: AlertPriority): Observable<Alert[]> {
    return of(this.alerts.filter(alert => alert.priority === priority));
  }

  getStats() {
    const stats = {
      total: this.alerts.length,
      active: this.alerts.filter(a => a.status === AlertStatus.ACTIVE).length,
      sent: this.alerts.filter(a => a.status === AlertStatus.SENT).length,
      critical: this.alerts.filter(a => a.priority === AlertPriority.CRITICAL).length,
      byType: {
        weather: this.alerts.filter(a => a.type === AlertType.WEATHER).length,
        payment: this.alerts.filter(a => a.type === AlertType.PAYMENT).length,
        price: this.alerts.filter(a => a.type === AlertType.PRICE).length,
        security: this.alerts.filter(a => a.type === AlertType.SECURITY).length,
        maintenance: this.alerts.filter(a => a.type === AlertType.MAINTENANCE).length,
        emergency: this.alerts.filter(a => a.type === AlertType.EMERGENCY).length,
        info: this.alerts.filter(a => a.type === AlertType.INFO).length
      }
    };
    
    return of(stats);
  }

  createAlert(alertData: Partial<Alert>): Observable<Alert> {
    const newAlert: Alert = {
      id: `ALERT-${(this.alerts.length + 1).toString().padStart(3, '0')}`,
      title: alertData.title || 'New Alert',
      description: alertData.description || '',
      type: alertData.type || AlertType.INFO,
      priority: alertData.priority || AlertPriority.MEDIUM,
      recipients: alertData.recipients || 0,
      regions: alertData.regions || ['All Regions'],
      channels: alertData.channels || [AlertChannel.SMS],
      deliveryRate: alertData.deliveryRate || 0,
      date: new Date(),
      status: AlertStatus.DRAFT,
      createdBy: alertData.createdBy || 'admin'
    };
    
    this.alerts.unshift(newAlert);
    return of(newAlert);
  }
}