export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  recipients: number;
  regions?: string[];
  channels: AlertChannel[];
  deliveryRate: number;
  date: Date;
  status: AlertStatus;
  createdBy: string;
}

export enum AlertType {
  WEATHER = 'weather',
  PAYMENT = 'payment',
  PRICE = 'price',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency',
  INFO = 'info'
}

export enum AlertPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum AlertChannel {
  SMS = 'sms',
  PUSH = 'push',
  EMAIL = 'email',
  VOICE = 'voice',
  IN_APP = 'in_app'
}

export enum AlertStatus {
  ACTIVE = 'active',
  SENT = 'sent',
  DRAFT = 'draft',
  FAILED = 'failed',
  SCHEDULED = 'scheduled'
}