// ─── Enums ────────────────────────────────────────────────────────────────────

export enum AlertStatus {
  CRITICAL = 'critical',
  WARNING  = 'warning',
  NORMAL   = 'normal'
}

export enum MessageStatus {
  SENT      = 'sent',
  SCHEDULED = 'scheduled',
  DRAFT     = 'draft',
  FAILED    = 'failed'
}

export enum Language {
  FRENCH   = 'French',
  ENGLISH  = 'English',
  FULFULDE = 'Fulfulde',
  EWONDO   = 'Ewondo',
  DUALA    = 'Duala'
}

// ─── Audio Library ────────────────────────────────────────────────────────────

/**
 * A single configured audio asset in the library.
 * One record = one title + one language.
 * The same message in 3 languages = 3 separate records.
 */
export interface AudioLibraryItem {
  id:           number;
  title:        string;         // e.g. "NPK Fertilizer Availability"
  language:     string;         // e.g. "French"
  duration:     number;         // seconds
  durationLabel:string;         // e.g. "2:45"
  fileName:     string;
  filePath:     string;         // server-side path
  blob:         Blob | null;    // in-memory while not yet uploaded
  objectUrl:    string | null;  // browser object URL for preview
  uploadStatus: 'pending' | 'uploading' | 'done' | 'error';
  uploadProgress: number;
  usageCount:   number;         // how many broadcasts reference this
  createdAt:    Date;
}

// ─── Audio Variant (attached to a Broadcast) ─────────────────────────────────

/**
 * Reference from a Broadcast to an AudioLibraryItem.
 * reused = true  → filePath copied from library, no re-upload needed.
 * reused = false → newly recorded/uploaded for this broadcast.
 */
export interface AudioVariant {
  language:       string;
  blob:           Blob | null;
  objectUrl:      string | null;
  filePath:       string;
  fileName:       string;
  duration:       number;
  durationLabel:  string;
  uploadStatus:   'pending' | 'uploading' | 'done' | 'error';
  uploadProgress: number;
  listenCount:    number;
  reused:         boolean;
  audioLibraryId?: number;   // reference to the AudioLibraryItem it came from
}

// ─── Broadcast ───────────────────────────────────────────────────────────────

export type AnnouncementType =
  | 'announcement'
  | 'need'
  | 'market_price'
  | 'weather_alert'
  | 'training'
  | 'payment'
  | 'emergency';

export type RepeatSchedule = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type PlaybackState  = 'stopped' | 'playing' | 'paused';

export interface Broadcast {
  id:               number;
  title:            string;
  type:             AnnouncementType;
  language:         string;
  variants:         AudioVariant[];      // one per language
  duration:         number;
  durationLabel:    string;
  listeners:        number;
  date:             Date;
  expiresAt?:       Date;
  status:           'sent' | 'draft' | 'scheduled' | 'failed';
  repeatSchedule:   RepeatSchedule;
  targetAudience:   string;
  autoPlay:         boolean;
  smsTranscription: boolean;
  emailEnabled:     boolean;
  scriptTemplateId?: string;             // Template used for SMS fallback
  playbackState:    PlaybackState;
  playbackProgress: number;
}

// ─── Alert ───────────────────────────────────────────────────────────────────

export interface AlertItem {
  id:           string;
  type:         string;
  priority:     'critical' | 'warning' | 'information' | 'low';
  title:        string;
  description:  string;
  recipients:   number;
  regions:      string[];
  channels:     string[];               // 'audio' | 'sms' | 'email'
  deliveryRate: number;
  date:         Date;
  status:       'active' | 'sent' | 'draft' | 'failed' | 'scheduled';
  createdBy:    string;
  scriptTemplateId?: string;            // Template used for SMS/email body
  audioLibraryId?: number;              // Reference to AudioLibraryItem for audio alert
}

// ─── Alert Input ─────────────────────────────────────────────────────────────

/**
 * Payload accepted by CommunicationService.createAlert().
 * Matches the inline type already expected by the service, extended
 * with the optional audioLibraryId field used by the dashboard.
 */
export interface CreateAlertInput {
  title:             string;
  description:       string;
  type:              string;
  priority:          string;
  targetAudience:    string;
  specificZone?:     string;
  channels:          string[];
  expiresAt?:        Date;
  scriptTemplateId?: string;
  audioLibraryId?:   number;   // reference to AudioLibraryItem for audio alert
}

// ─── Message Template ─────────────────────────────────────────────────────────

export interface MsgTemplate {
  id:          string;
  title:       string;
  description: string;
  content:     string;
  type:        string;
  category:    string;
  language:    string;
  createdDate: string;
  usageCount:  number;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

export interface Toast {
  id:      number;
  type:    'success' | 'error' | 'info' | 'warning';
  message: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalMessages: { current: number; previous: number; trend: number; };
  activeAlerts:  { count: number; status: AlertStatus; };
  audioMessages: { count: number; languages: number; deliveryRate: number; deliveryTrend: number; };
}

// ─── Legacy interfaces kept for service compatibility ─────────────────────────

export interface AudioMessage {
  id:             number;
  title:          string;
  language:       Language;
  duration:       string;
  listeners:      number;
  date:           string;
  status:         MessageStatus;
  fileUrl?:       string;
  targetAudience: string;
  autoPlay:       boolean;
  createdAt:      Date;
  scheduledFor?:  Date;
}

export interface MessageTemplate {
  id:         number;
  name:       string;
  title:      string;
  body:       string;
  language:   Language;
  category:   string;
  createdBy:  string;
  createdAt:  Date;
  lastUsed:   Date;
  usageCount: number;
}

export interface ResourceRequest {
  id:           number;
  type:         string;
  quantity:     number;
  requester:    string;
  status:       'pending' | 'approved' | 'rejected' | 'fulfilled';
  requestedAt:  Date;
  completedAt?: Date;
  notes?:       string;
}

export interface ApiResponse<T> {
  success:   boolean;
  data?:     T;
  message?:  string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface MessageFilter {
  language?:   Language;
  status?:     MessageStatus;
  startDate?:  Date;
  endDate?:    Date;
  searchTerm?: string;
  page?:       number;
  limit?:      number;
}

export interface DashboardSummary {
  totalMessages:       number;
  totalAlerts:         number;
  totalAudioMessages:  number;
  totalListeners:      number;
  averageDeliveryRate: number;
  recentActivity:      RecentActivity[];
}

export interface RecentActivity {
  id:        number;
  type:      'message' | 'alert' | 'resource';
  action:    string;
  user:      string;
  timestamp: Date;
  details?:  any;
}

// ─── Seed defaults ────────────────────────────────────────────────────────────

export const DEFAULT_DASHBOARD_STATS: DashboardStats = {
  totalMessages: { current: 247, previous: 0, trend: 45 },
  activeAlerts:  { count: 23, status: AlertStatus.CRITICAL },
  audioMessages: { count: 87, languages: 5, deliveryRate: 94.5, deliveryTrend: 1.2 }
};

export const DEFAULT_RECENT_MESSAGES: AudioMessage[] = [
  {
    id: 1, title: 'Fertilizer Delivery Announcement', language: Language.FRENCH,
    duration: '2:45 min', listeners: 245, date: new Date().toISOString().split('T')[0],
    status: MessageStatus.SENT, targetAudience: 'All Members', autoPlay: true, createdAt: new Date()
  }
];

// ─── Utilities ───────────────────────────────────────────────────────────────

export function formatDuration(minutes: number, seconds = 0): string {
  const total = minutes * 60 + seconds;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

export function getLanguageColor(language: Language): string {
  const colors: Record<Language, string> = {
    [Language.FRENCH]:   '#4285f4',
    [Language.ENGLISH]:  '#34a853',
    [Language.FULFULDE]: '#fbbc05',
    [Language.EWONDO]:   '#ea4335',
    [Language.DUALA]:    '#9c27b0'
  };
  return colors[language] ?? '#666';
}
