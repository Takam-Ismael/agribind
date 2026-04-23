import {
  Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone,
  ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CommunicationService } from '../communication.service';
import {
  AudioLibraryItem, AudioVariant, Broadcast, AlertItem, MsgTemplate, Toast,
  AnnouncementType, RepeatSchedule, PlaybackState
} from '../communication.model';

// ─── local type aliases ───────────────────────────────────────────────────────
type AudioStatus = 'idle' | 'recording' | 'recorded' | 'uploading' | 'done';
type ActiveTab   = 'audio-library' | 'announcements' | 'alerts' | 'templates';

// ─── Pagination helper ────────────────────────────────────────────────────────
class Paginator {
  page     = 1;
  pageSize: number;
  constructor(pageSize = 8) { this.pageSize = pageSize; }
  slice<T>(items: T[]): T[] {
    const start = (this.page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }
  totalPages(total: number): number { return Math.max(1, Math.ceil(total / this.pageSize)); }
  pages(total: number): number[] {
    const tp = this.totalPages(total);
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const s = new Set([1, tp, this.page - 1, this.page, this.page + 1].filter(p => p >= 1 && p <= tp));
    const arr = [...s].sort((a, b) => a - b);
    const result: number[] = [];
    arr.forEach((p, i) => { if (i > 0 && p - arr[i - 1] > 1) result.push(-1); result.push(p); });
    return result;
  }
  goTo(p: number, total: number): void { this.page = Math.max(1, Math.min(p, this.totalPages(total))); }
  reset(): void { this.page = 1; }
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-communication-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './communication-dashboard.component.html',
  styleUrls:   ['./communication-dashboard.component.scss']
})
export class CommunicationDashboardComponent implements OnInit, OnDestroy {

  @ViewChild('waveformCanvas')  waveformCanvas!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('hiddenFileInput') hiddenFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('libFileInput')    libFileInput!:    ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();
  private toastCounter = 0;

  // ─── Navigation ──────────────────────────────────────────────────────────
  activeSection: ActiveTab = 'audio-library';

  readonly navTabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'audio-library',  label: 'Audio Library',        icon: 'fas fa-music'     },
    { id: 'announcements',  label: 'Announcements & Needs', icon: 'fas fa-bullhorn'  },
    { id: 'alerts',         label: 'Alerts',                icon: 'fas fa-bell'      },
    { id: 'templates',      label: 'Templates',             icon: 'fas fa-file-alt'  },
  ];

  setActiveSection(id: string): void {
    this.activeSection = id as ActiveTab;
    if (id === 'alerts') this.recalcAlertStats();
  }

  // ─── Paginators (one per tab) ─────────────────────────────────────────────
  libPager       = new Paginator(8);
  broadcastPager = new Paginator(6);
  alertPager     = new Paginator(6);
  templatePager  = new Paginator(8);

  pageSummary(pager: Paginator, total: number): string {
    if (total === 0) return 'No results';
    const from = (pager.page - 1) * pager.pageSize + 1;
    const to   = Math.min(pager.page * pager.pageSize, total);
    return `Showing ${from}\u2013${to} of ${total}`;
  }

  // ─── Toast ───────────────────────────────────────────────────────────────
  toasts: Toast[] = [];
  toast(type: Toast['type'], message: string): void {
    const t: Toast = { id: ++this.toastCounter, type, message };
    this.toasts.push(t);
    setTimeout(() => this.dismissToast(t.id), 4500);
  }
  dismissToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }

  // ─── Metrics ─────────────────────────────────────────────────────────────
  metrics = {
    totalMessages: { value: 5247,    change: '45 this week' },
    audioMessages: { value: 87,      info:   '5 languages'  },
    activeAlerts:  { value: 23,      status: '3 critical'   },
    deliveryRate:  { value: '94.5%', change: '+1.2%'        },
  };

  private loadStatistics(): void {
    this.commService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: any) => {
          if (!stats) return; // keep demo defaults if API returned null/error

          const totalSent   = Number(stats?.totalMessagesSent   ?? stats?.total_messages_sent   ?? 0);
          const thisWeek    = Number(stats?.messagesSentThisWeek ?? stats?.messages_sent_this_week ?? 0);
          const audioTotal  = Number(stats?.audioMessagesTotal   ?? stats?.audio_messages_total   ?? 0);
          const audioLangs  = Number(stats?.audioLanguagesSupported ?? stats?.audio_languages_supported ?? 5);
          const activeAl    = Number(stats?.activeAlerts   ?? stats?.active_alerts   ?? 0);
          const criticalAl  = Number(stats?.criticalAlerts ?? stats?.critical_alerts ?? 0);
          const rate        = Number(stats?.deliveryRate        ?? stats?.delivery_rate        ?? 0);
          const rateChange  = Number(stats?.deliveryRateChange  ?? stats?.delivery_rate_change  ?? 0);

          this.metrics.totalMessages.value  = totalSent;
          this.metrics.totalMessages.change = `${thisWeek} this week`;

          this.metrics.audioMessages.value = audioTotal;
          this.metrics.audioMessages.info  = `${audioLangs} languages`;

          this.metrics.activeAlerts.value  = activeAl;
          this.metrics.activeAlerts.status = criticalAl > 0 ? `${criticalAl} critical` : 'No critical';

          this.metrics.deliveryRate.value  = `${rate.toFixed(1)}%`;
          this.metrics.deliveryRate.change = `${rateChange >= 0 ? '+' : ''}${rateChange.toFixed(1)}%`;

          this.cdr.markForCheck();
        },
        error: () => {
          // Keep the demo defaults if the API is unreachable
        }
      });
  }

  // ─── Shared data ─────────────────────────────────────────────────────────
 supportedLanguages: string[] = [];
  readonly today = new Date().toISOString().split('T')[0];

  readonly announcementTypes: { value: AnnouncementType; label: string; icon: string; color: string }[] = [
    { value: 'announcement',  label: 'General Announcement', icon: 'fas fa-bullhorn',            color: '#3b82f6' },
    { value: 'need',          label: 'Publication of Need',  icon: 'fas fa-seedling',             color: '#16a34a' },
    { value: 'market_price',  label: 'Market Price Update',  icon: 'fas fa-chart-line',           color: '#d97706' },
    { value: 'weather_alert', label: 'Weather Alert',        icon: 'fas fa-cloud-rain',           color: '#6366f1' },
    { value: 'training',      label: 'Agricultural Training',icon: 'fas fa-graduation-cap',       color: '#0891b2' },
    { value: 'payment',       label: 'Payment / Microcredit',icon: 'fas fa-money-bill-wave',      color: '#059669' },
    { value: 'emergency',     label: 'Emergency Alert',      icon: 'fas fa-exclamation-triangle', color: '#dc2626' },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1 — AUDIO LIBRARY
  // ═══════════════════════════════════════════════════════════════════════════

  audioLibrary: AudioLibraryItem[] = [];
  isLoadingAudioLibrary = false;

  private mapBackendAudioLibraryItemToUI(x: any): AudioLibraryItem {
    const filePath = String(x?.filePath ?? '');
    const audioUrl = filePath ? this.commService.getAudioUrl(filePath) : null;
    return {
      id: Number(x?.id ?? 0),
      title: String(x?.title ?? ''),
      language: String(x?.language ?? ''),
      duration: Number(x?.durationSeconds ?? x?.duration ?? 0),
      durationLabel: String(x?.durationLabel ?? ''),
      fileName: String(x?.fileName ?? ''),
      filePath,
      blob: null,
      objectUrl: audioUrl,
      uploadStatus: 'done',
      uploadProgress: 100,
      usageCount: Number(x?.usageCount ?? 0),
      createdAt: x?.createdAt ? new Date(x.createdAt) : new Date()
    };
  }

  loadAudioLibrary(): void {
    this.isLoadingAudioLibrary = true;
    this.commService.getAudioLibrary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items: any[]) => {
          this.audioLibrary = (items ?? []).map(x => this.mapBackendAudioLibraryItemToUI(x));
          this.isLoadingAudioLibrary = false;
        },
        error: () => {
          this.isLoadingAudioLibrary = false;
          this.toast('error', 'Failed to load audio library.');
        }
      });
  }

  // filters
  libSearch   = '';
  libLangFilter = 'all';
  libTitleFilter = 'all';

  get filteredLibrary(): AudioLibraryItem[] {
    const q = this.libSearch.trim().toLowerCase();
    const result = this.audioLibrary.filter(a =>
      (this.libLangFilter  === 'all' || a.language === this.libLangFilter) &&
      (this.libTitleFilter === 'all' || a.title    === this.libTitleFilter) &&
      (!q || a.title.toLowerCase().includes(q) || a.language.toLowerCase().includes(q))
    );
    if (this.libPager.totalPages(result.length) < this.libPager.page) this.libPager.reset();
    return result;
  }

  get pagedLibrary(): AudioLibraryItem[] { return this.libPager.slice(this.filteredLibrary); }

  get uniqueTitles(): string[] {
    return [...new Set(this.audioLibrary.map(a => a.title))];
  }

  // playback
  private libAudio: HTMLAudioElement | null = null;
  private libInterval: ReturnType<typeof setInterval> | null = null;
  playingLibId: number | null = null;

  toggleLibPlay(item: AudioLibraryItem): void {
    if (!item.objectUrl) { this.toast('info', 'Audio stored on server — playback unavailable in demo.'); return; }
    if (this.playingLibId === item.id) {
      this.libAudio?.pause();
      this.playingLibId = null;
      if (this.libInterval) clearInterval(this.libInterval);
      return;
    }
    this.libAudio?.pause();
    if (this.libInterval) clearInterval(this.libInterval);
    this.libAudio = new Audio(item.objectUrl);
    this.libAudio.play();
    this.playingLibId = item.id;
    this.libAudio.onended = () => { this.playingLibId = null; this.cdr.markForCheck(); };
  }

  // add to library modal
  showAddAudioModal = false;
  libForm = { title: '', language: 'French' };
  libAudioStatus: AudioStatus = 'idle';
  libPendingBlob:      Blob   | null = null;
  libPendingObjectUrl: string | null = null;
  libSelectedFileName = '';
  libRecordingSeconds = 0;
  isUploadingToLib    = false;

  private libMediaRecorder: MediaRecorder | null = null;
  private libAudioChunks: Blob[] = [];
  private libRecordTimer: ReturnType<typeof setInterval> | null = null;
  private libAnalyser: AnalyserNode | null = null;
  private libAnimFrame: number | null = null;

  get libRecordingLabel(): string {
    const m = Math.floor(this.libRecordingSeconds / 60);
    const s = this.libRecordingSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  openAddAudioModal(): void { this.showAddAudioModal = true; this.resetLibForm(); }
  closeAddAudioModal(): void {
    if (this.libAudioStatus === 'recording') this.stopLibRecording();
    this.resetLibPreListen();
    this.showAddAudioModal = false;
    this.resetLibForm();
  }

  private resetLibForm(): void {
    this.libForm = { title: '', language: 'French' };
    this.libAudioStatus = 'idle';
    if (this.libPendingObjectUrl) URL.revokeObjectURL(this.libPendingObjectUrl);
    this.libPendingBlob = null; this.libPendingObjectUrl = null;
    this.libSelectedFileName = ''; this.libRecordingSeconds = 0;
  }

  async startLibRecording(): Promise<void> {
    if (this.libAudioStatus !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      this.libAnalyser = ctx.createAnalyser(); this.libAnalyser.fftSize = 512;
      src.connect(this.libAnalyser);
      this.libMediaRecorder = new MediaRecorder(stream);
      this.libAudioChunks = [];
      this.libMediaRecorder.ondataavailable = e => { if (e.data.size > 0) this.libAudioChunks.push(e.data); };
      this.libMediaRecorder.onstop = () => {
        this.libPendingBlob = new Blob(this.libAudioChunks, { type: 'audio/webm;codecs=opus' });
        if (this.libPendingObjectUrl) URL.revokeObjectURL(this.libPendingObjectUrl);
        this.libPendingObjectUrl = URL.createObjectURL(this.libPendingBlob);
        stream.getTracks().forEach(t => t.stop());
        this.stopLibWaveform(); ctx.close();
        this.libAudioStatus = 'recorded'; this.cdr.markForCheck();
      };
      this.libMediaRecorder.start(100);
      this.libAudioStatus = 'recording'; this.libRecordingSeconds = 0;
      this.libRecordTimer = setInterval(() => { this.libRecordingSeconds++; this.cdr.markForCheck(); }, 1000);
      this.startLibWaveform();
    } catch (err: any) {
      this.toast('error', err?.name === 'NotAllowedError' ? 'Microphone access denied.' : `Microphone error: ${err?.message}`);
    }
  }

  stopLibRecording(): void {
    if (this.libAudioStatus !== 'recording' || !this.libMediaRecorder) return;
    this.libMediaRecorder.stop();
    if (this.libRecordTimer) clearInterval(this.libRecordTimer);
  }

  private startLibWaveform(): void {
    const draw = () => {
      const canvas = this.waveformCanvas?.nativeElement;
      if (!canvas || !this.libAnalyser) return;
      const ctx = canvas.getContext('2d')!;
      const buf = new Uint8Array(this.libAnalyser.frequencyBinCount);
      this.libAnalyser.getByteTimeDomainData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2; ctx.strokeStyle = '#328048'; ctx.beginPath();
      const sw = canvas.width / buf.length; let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const y = (buf[i] / 128.0) * (canvas.height / 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); x += sw;
      }
      ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
      this.libAnimFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  private stopLibWaveform(): void {
    if (this.libAnimFrame !== null) cancelAnimationFrame(this.libAnimFrame);
  }

  triggerLibFileInput(): void { this.libFileInput?.nativeElement?.click(); }

  onLibFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { this.toast('error', 'Please select a valid audio file.'); return; }
    if (file.size > 50 * 1024 * 1024)   { this.toast('error', 'Maximum file size is 50 MB.'); return; }
    this.libSelectedFileName = file.name; this.libPendingBlob = file;
    if (this.libPendingObjectUrl) URL.revokeObjectURL(this.libPendingObjectUrl);
    this.libPendingObjectUrl = URL.createObjectURL(file);
    this.libAudioStatus = 'recorded';
    const tmp = new Audio(this.libPendingObjectUrl);
    tmp.addEventListener('loadedmetadata', () => { this.libRecordingSeconds = Math.round(tmp.duration); this.cdr.markForCheck(); });
  }

  discardLibRecording(): void {
    if (this.libPendingObjectUrl) URL.revokeObjectURL(this.libPendingObjectUrl);
    this.libPendingBlob = null; this.libPendingObjectUrl = null;
    this.libSelectedFileName = ''; this.libRecordingSeconds = 0;
    this.libAudioStatus = 'idle'; this.resetLibPreListen();
  }

  // pre-listen for library modal
  libPreListenAudio:    HTMLAudioElement | null = null;
  libPreListenState:    PlaybackState = 'stopped';
  libPreListenProgress  = 0;
  private libPreInterval: ReturnType<typeof setInterval> | null = null;

  toggleLibPreListen(): void {
    const url = this.libPendingObjectUrl; if (!url) return;
    if (this.libPreListenState === 'stopped') {
      this.libPreListenAudio = new Audio(url); this.libPreListenAudio.play();
      this.libPreListenState = 'playing';
      this.libPreInterval = setInterval(() => {
        if (!this.libPreListenAudio) return;
        this.libPreListenProgress = (this.libPreListenAudio.currentTime / (this.libPreListenAudio.duration || 1)) * 100;
        this.cdr.markForCheck();
      }, 250);
      this.libPreListenAudio.onended = () => { this.resetLibPreListen(); this.cdr.markForCheck(); };
    } else if (this.libPreListenState === 'playing') {
      this.libPreListenAudio?.pause(); this.libPreListenState = 'paused';
    } else {
      this.libPreListenAudio?.play(); this.libPreListenState = 'playing';
    }
  }

  private resetLibPreListen(): void {
    if (this.libPreInterval) clearInterval(this.libPreInterval);
    this.libPreListenAudio?.pause(); this.libPreListenAudio = null;
    this.libPreListenState = 'stopped'; this.libPreListenProgress = 0;
  }

  get canSaveToLibrary(): boolean {
    return !!this.libForm.title.trim() && !!this.libForm.language && !!this.libPendingBlob;
  }

  saveToLibrary(): void {
    if (!this.canSaveToLibrary) return;
    this.isUploadingToLib = true;
    const fd = new FormData();
    fd.append('file', this.libPendingBlob!, this.libSelectedFileName || `${this.libForm.language}-audio.webm`);
    fd.append('title', this.libForm.title);
    fd.append('language', this.libForm.language);
    fd.append('durationSeconds', String(this.libRecordingSeconds));
    fd.append('durationLabel', this.libRecordingLabel);

    this.commService.uploadToAudioLibrary(fd).pipe(takeUntil(this.destroy$)).subscribe({
      next: (created: any) => {
        this.isUploadingToLib = false;
        this.toast('success', `"${this.libForm.title}" (${this.libForm.language}) saved to audio library.`);
        this.closeAddAudioModal();
        this.loadAudioLibrary();
      },
      error: () => {
        this.isUploadingToLib = false;
        this.toast('error', 'Upload failed. Please try again.');
      }
    });
  }

  // rename / delete library item
  editingLibId: number | null = null;
  editingLibTitle = '';

  startLibRename(item: AudioLibraryItem): void { this.editingLibId = item.id; this.editingLibTitle = item.title; }
  confirmLibRename(item: AudioLibraryItem): void {
    if (!this.editingLibTitle.trim()) { this.toast('warning', 'Title cannot be empty.'); return; }
    const newTitle = this.editingLibTitle.trim();
    this.commService.renameAudioLibraryItem(item.id, newTitle)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingLibId = null;
          this.toast('success', 'Renamed.');
          this.loadAudioLibrary();
        },
        error: () => this.toast('error', 'Failed to rename audio item.')
      });
  }
  cancelLibRename(): void { this.editingLibId = null; }

  deleteLibItem(item: AudioLibraryItem): void {
    if (!confirm(`Delete "${item.title}" (${item.language})? This cannot be undone.`)) return;
    this.commService.deleteAudioLibraryItem(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
          this.toast('success', 'Audio deleted from library.');
          this.loadAudioLibrary();
        },
        error: () => this.toast('error', 'Failed to delete audio item.')
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2 — ANNOUNCEMENTS & NEEDS
  // ═══════════════════════════════════════════════════════════════════════════

  broadcasts: Broadcast[] = [];
  isLoadingBroadcasts = false;

  private mapBackendBroadcastToUI(b: any): Broadcast {
    const variants = (b?.variants ?? []).map((v: any): AudioVariant => ({
      language: String(v?.language ?? ''),
      blob: null,
     objectUrl: v?.filePath ? this.commService.getAudioUrl(v.filePath) : null,
      filePath: String(v?.filePath ?? ''),
      fileName: String(v?.fileName ?? ''),
      duration: Number(v?.durationSeconds ?? 0),
      durationLabel: String(v?.durationLabel ?? '0:00'),
      uploadStatus: 'done',
      uploadProgress: 100,
      listenCount: Number(v?.listenCount ?? 0),
      reused: true,
      audioLibraryId: v?.audioLibraryId != null ? Number(v.audioLibraryId) : undefined
    }));

    const first = variants[0];
    return {
      id: Number(b?.id ?? 0),
      title: String(b?.title ?? ''),
      type: b?.type ?? 'announcement',
      language: first?.language ?? '',
      variants,
      duration: Number(b?.duration ?? first?.duration ?? 0),
      durationLabel: String(b?.durationLabel ?? first?.durationLabel ?? '0:00'),
      listeners: Number(b?.listeners ?? 0),
      date: b?.date ? new Date(b.date) : new Date(),
      expiresAt: b?.expiresAt ? new Date(b.expiresAt) : undefined,
      status: (b?.status ?? 'sent') as Broadcast['status'],
      repeatSchedule: (b?.repeatSchedule ?? 'none') as RepeatSchedule,
      targetAudience: String(b?.targetAudience ?? 'ALL_MEMBERS'),
      autoPlay: !!b?.autoPlay,
      smsTranscription: !!b?.smsTranscription,
      emailEnabled: !!b?.emailEnabled,
      scriptTemplateId: b?.scriptTemplateId ?? undefined,
      playbackState: 'stopped',
      playbackProgress: 0
    };
  }

  loadBroadcasts(): void {
    this.isLoadingBroadcasts = true;
    this.commService.getBroadcasts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items: any[]) => {
          this.broadcasts = (items ?? []).map(x => this.mapBackendBroadcastToUI(x));
          this.isLoadingBroadcasts = false;
        },
        error: () => {
          this.isLoadingBroadcasts = false;
          this.toast('error', 'Failed to load broadcasts.');
        }
      });
  }

  broadcastSearch   = '';
  audioTypeFilter: AnnouncementType | 'all' = 'all';
  audioLangFilter = 'all';

  get filteredBroadcasts(): Broadcast[] {
    const q = this.broadcastSearch.trim().toLowerCase();
    const result = this.broadcasts.filter(b =>
      (this.audioTypeFilter === 'all' || b.type === this.audioTypeFilter) &&
      (this.audioLangFilter === 'all' || b.variants.some(v => v.language === this.audioLangFilter)) &&
      (!q || b.title.toLowerCase().includes(q))
    );
    if (this.broadcastPager.totalPages(result.length) < this.broadcastPager.page) this.broadcastPager.reset();
    return result;
  }

  get pagedBroadcasts(): Broadcast[] { return this.broadcastPager.slice(this.filteredBroadcasts); }

  // ── Broadcast library playback ─────────────────────────────────────────────
  private libraryAudio: HTMLAudioElement | null = null;
  private libraryInterval: ReturnType<typeof setInterval> | null = null;

  toggleBroadcast(b: Broadcast): void {
    const pv = b.variants[0];
    if (!pv?.objectUrl) { this.toast('info', 'Audio stored on server — playback unavailable in demo.'); return; }
    this.broadcasts.forEach(x => { if (x.id !== b.id && x.playbackState !== 'stopped') { x.playbackState = 'stopped'; x.playbackProgress = 0; } });
    if (this.libraryAudio && b.playbackState === 'playing') { this.libraryAudio.pause(); b.playbackState = 'paused'; return; }
    if (this.libraryAudio && b.playbackState === 'paused')  { this.libraryAudio.play();  b.playbackState = 'playing'; return; }
    if (this.libraryInterval) clearInterval(this.libraryInterval);
    this.libraryAudio?.pause();
    this.libraryAudio = new Audio(pv.objectUrl);
    this.libraryAudio.play(); b.playbackState = 'playing';
    this.libraryInterval = setInterval(() => {
      if (!this.libraryAudio) return;
      b.playbackProgress = (this.libraryAudio.currentTime / (this.libraryAudio.duration || 1)) * 100;
      this.cdr.markForCheck();
    }, 300);
    this.libraryAudio.onended = () => { b.playbackState = 'stopped'; b.playbackProgress = 0; if (this.libraryInterval) clearInterval(this.libraryInterval); this.cdr.markForCheck(); };
  }

  deleteBroadcast(b: Broadcast): void {
    if (!confirm(`Delete "${b.title}"?`)) return;
    this.commService.deleteBroadcast(b.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (this.showBroadcastDetail && this.selectedBroadcast?.id === b.id) this.showBroadcastDetail = false;
        this.toast('success', `"${b.title}" deleted.`);
        this.loadBroadcasts();
        this.loadStatistics();
      },
      error: () => this.toast('error', `Failed to delete broadcast.`)
    });
  }

  // inline rename
  editingBroadcastId: number | null = null;
  editingBroadcastTitle = '';
  startRename(b: Broadcast): void  { this.editingBroadcastId = b.id; this.editingBroadcastTitle = b.title; }
  confirmRename(b: Broadcast): void {
    if (!this.editingBroadcastTitle.trim()) { this.toast('warning', 'Title cannot be empty.'); return; }
    const newTitle = this.editingBroadcastTitle.trim();
    this.commService.renameBroadcast(b.id, newTitle).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.editingBroadcastId = null;
        this.toast('success', 'Renamed.');
        this.loadBroadcasts();
      },
      error: () => this.toast('error', 'Failed to rename broadcast.')
    });
  }
  cancelRename(): void { this.editingBroadcastId = null; }

  selectedBroadcast: Broadcast | null = null;
  showBroadcastDetail = false;
  viewBroadcastDetail(b: Broadcast): void { this.selectedBroadcast = b; this.showBroadcastDetail = true; }

  // ── NEW BROADCAST MODAL ────────────────────────────────────────────────────

  showBroadcastModal = false;
  isBroadcasting     = false;
  uploadProgress     = 0;

  broadcastForm: {
    title:            string;
    type:             AnnouncementType;
    targetAudience:   string;
    repeatSchedule:   RepeatSchedule;
    scheduleFor:      string;
    expiresAt:        string;
    autoPlay:         boolean;
    smsTranscription: boolean;
    selectedVariants: AudioVariant[];   // audio clips picked from library or recorded inline
    scriptTemplateId: string;           // selected template id
  } = this.freshBroadcastForm();

  private freshBroadcastForm() {
    return {
      title: '', type: 'announcement' as AnnouncementType,
      targetAudience: 'ALL_MEMBERS', repeatSchedule: 'none' as RepeatSchedule,
      scheduleFor: '', expiresAt: '',
      autoPlay: true, smsTranscription: true,
      selectedVariants: [], scriptTemplateId: ''
    };
  }

  openBroadcastModal(): void { this.showBroadcastModal = true; this.broadcastForm = this.freshBroadcastForm(); this.resetInlineAudio(); }
  closeBroadcastModal(): void {
    if (this.inlineAudioStatus === 'recording') this.stopRecording();
    this.resetInlineAudio(); this.showBroadcastModal = false;
    this.broadcastForm = this.freshBroadcastForm();
  }

  // ── Audio selection from library inside the broadcast modal ──────────────
  broadcastLangFilter = 'all';
  broadcastTitleSearch = '';

  get availableLibraryForBroadcast(): AudioLibraryItem[] {
    const q = this.broadcastTitleSearch.trim().toLowerCase();
    const addedLangs = new Set(this.broadcastForm.selectedVariants.map(v => v.language));
    return this.audioLibrary.filter(a =>
      !addedLangs.has(a.language) &&
      (this.broadcastLangFilter === 'all' || a.language === this.broadcastLangFilter) &&
      (!q || a.title.toLowerCase().includes(q))
    );
  }

  selectLibraryAudio(item: AudioLibraryItem): void {
    // If this language is already added, replace it
    const existing = this.broadcastForm.selectedVariants.findIndex(v => v.language === item.language);
    const variant: AudioVariant = {
      language: item.language, blob: item.blob, objectUrl: item.objectUrl,
      filePath: item.filePath, fileName: item.fileName,
      duration: item.duration, durationLabel: item.durationLabel,
      uploadStatus: 'done', uploadProgress: 100, listenCount: 0,
      reused: true, audioLibraryId: item.id
    };
    if (existing >= 0) { this.broadcastForm.selectedVariants[existing] = variant; }
    else               { this.broadcastForm.selectedVariants.push(variant); }
    this.toast('info', `"${item.title}" (${item.language}) attached.`);
  }

  removeVariant(lang: string): void {
    const idx = this.broadcastForm.selectedVariants.findIndex(v => v.language === lang);
    if (idx >= 0) {
      const v = this.broadcastForm.selectedVariants[idx];
      if (v.objectUrl && !v.reused) URL.revokeObjectURL(v.objectUrl);
      this.broadcastForm.selectedVariants.splice(idx, 1);
    }
  }

  // ── Inline audio recording inside the broadcast modal ─────────────────────
  inlineAudioStatus: AudioStatus = 'idle';
  inlineLang         = 'French';
  inlinePendingBlob:      Blob   | null = null;
  inlinePendingObjectUrl: string | null = null;
  inlineFileName = '';
  inlineRecordingSeconds = 0;

  private inlineRecorder: MediaRecorder | null = null;
  private inlineChunks: Blob[] = [];
  private inlineRecordTimer: ReturnType<typeof setInterval> | null = null;
  private inlineAnalyser: AnalyserNode | null = null;
  private inlineAnimFrame: number | null = null;

  get inlineRecordingLabel(): string {
    const m = Math.floor(this.inlineRecordingSeconds / 60);
    const s = this.inlineRecordingSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get availableInlineLangs(): string[] {
    const added = new Set(this.broadcastForm.selectedVariants.map(v => v.language));
    return this.supportedLanguages.filter(l => !added.has(l));
  }

  async startRecording(): Promise<void> {
    if (this.inlineAudioStatus !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx    = new AudioContext();
      const src    = ctx.createMediaStreamSource(stream);
      this.inlineAnalyser = ctx.createAnalyser(); this.inlineAnalyser.fftSize = 512;
      src.connect(this.inlineAnalyser);
      this.inlineRecorder = new MediaRecorder(stream); this.inlineChunks = [];
      this.inlineRecorder.ondataavailable = e => { if (e.data.size > 0) this.inlineChunks.push(e.data); };
      this.inlineRecorder.onstop = () => {
        this.inlinePendingBlob = new Blob(this.inlineChunks, { type: 'audio/webm;codecs=opus' });
        if (this.inlinePendingObjectUrl) URL.revokeObjectURL(this.inlinePendingObjectUrl);
        this.inlinePendingObjectUrl = URL.createObjectURL(this.inlinePendingBlob);
        stream.getTracks().forEach(t => t.stop());
        this.stopInlineWaveform(); ctx.close();
        this.inlineAudioStatus = 'recorded'; this.cdr.markForCheck();
      };
      this.inlineRecorder.start(100);
      this.inlineAudioStatus = 'recording'; this.inlineRecordingSeconds = 0;
      this.inlineRecordTimer = setInterval(() => { this.inlineRecordingSeconds++; this.cdr.markForCheck(); }, 1000);
      this.startInlineWaveform();
    } catch (err: any) {
      this.toast('error', err?.name === 'NotAllowedError' ? 'Microphone access denied.' : `Microphone error: ${err?.message}`);
    }
  }

  stopRecording(): void {
    if (this.inlineAudioStatus !== 'recording' || !this.inlineRecorder) return;
    this.inlineRecorder.stop();
    if (this.inlineRecordTimer) clearInterval(this.inlineRecordTimer);
  }

  private startInlineWaveform(): void {
    const draw = () => {
      const canvas = this.waveformCanvas?.nativeElement;
      if (!canvas || !this.inlineAnalyser) return;
      const ctx = canvas.getContext('2d')!;
      const buf = new Uint8Array(this.inlineAnalyser.frequencyBinCount);
      this.inlineAnalyser.getByteTimeDomainData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2; ctx.strokeStyle = '#328048'; ctx.beginPath();
      const sw = canvas.width / buf.length; let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const y = (buf[i] / 128.0) * (canvas.height / 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); x += sw;
      }
      ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
      this.inlineAnimFrame = requestAnimationFrame(draw);
    };
    draw();
  }
  private stopInlineWaveform(): void { if (this.inlineAnimFrame !== null) cancelAnimationFrame(this.inlineAnimFrame); }

  triggerFileInput(): void { this.hiddenFileInput?.nativeElement?.click(); }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    if (!file.type.startsWith('audio/')) { this.toast('error', 'Please select a valid audio file.'); return; }
    if (file.size > 50 * 1024 * 1024)   { this.toast('error', 'Maximum file size is 50 MB.'); return; }
    this.inlineFileName = file.name; this.inlinePendingBlob = file;
    if (this.inlinePendingObjectUrl) URL.revokeObjectURL(this.inlinePendingObjectUrl);
    this.inlinePendingObjectUrl = URL.createObjectURL(file);
    this.inlineAudioStatus = 'recorded';
    const tmp = new Audio(this.inlinePendingObjectUrl);
    tmp.addEventListener('loadedmetadata', () => { this.inlineRecordingSeconds = Math.round(tmp.duration); this.cdr.markForCheck(); });
  }

  discardInlineRecording(): void {
    if (this.inlinePendingObjectUrl) URL.revokeObjectURL(this.inlinePendingObjectUrl);
    this.inlinePendingBlob = null; this.inlinePendingObjectUrl = null;
    this.inlineFileName = ''; this.inlineRecordingSeconds = 0;
    this.inlineAudioStatus = 'idle'; this.resetInlinePreListen();
  }

  // pre-listen inside broadcast modal
  inlinePreListenAudio:    HTMLAudioElement | null = null;
  inlinePreListenState:    PlaybackState = 'stopped';
  inlinePreListenProgress  = 0;
  private inlinePreInterval: ReturnType<typeof setInterval> | null = null;

  toggleInlinePreListen(): void {
    const url = this.inlinePendingObjectUrl; if (!url) return;
    if (this.inlinePreListenState === 'stopped') {
      this.inlinePreListenAudio = new Audio(url); this.inlinePreListenAudio.play();
      this.inlinePreListenState = 'playing';
      this.inlinePreInterval = setInterval(() => {
        if (!this.inlinePreListenAudio) return;
        this.inlinePreListenProgress = (this.inlinePreListenAudio.currentTime / (this.inlinePreListenAudio.duration || 1)) * 100;
        this.cdr.markForCheck();
      }, 250);
      this.inlinePreListenAudio.onended = () => { this.resetInlinePreListen(); this.cdr.markForCheck(); };
    } else if (this.inlinePreListenState === 'playing') {
      this.inlinePreListenAudio?.pause(); this.inlinePreListenState = 'paused';
    } else {
      this.inlinePreListenAudio?.play(); this.inlinePreListenState = 'playing';
    }
  }

  private resetInlinePreListen(): void {
    if (this.inlinePreInterval) clearInterval(this.inlinePreInterval);
    this.inlinePreListenAudio?.pause(); this.inlinePreListenAudio = null;
    this.inlinePreListenState = 'stopped'; this.inlinePreListenProgress = 0;
  }

  private resetInlineAudio(): void {
    if (this.inlineAudioStatus === 'recording') this.stopRecording();
    if (this.inlineRecordTimer) clearInterval(this.inlineRecordTimer);
    this.stopInlineWaveform(); this.resetInlinePreListen();
    this.inlineAudioStatus = 'idle'; this.inlinePendingBlob = null;
    if (this.inlinePendingObjectUrl) { URL.revokeObjectURL(this.inlinePendingObjectUrl); this.inlinePendingObjectUrl = null; }
    this.inlineFileName = ''; this.inlineRecordingSeconds = 0;
  }

  /**
   * Confirm the inline recording and add it as a variant.
   * Also saves it to the audio library automatically.
   */
  confirmInlineVariant(): void {
    if (!this.inlinePendingBlob) return;

    const fd = new FormData();
    fd.append('file', this.inlinePendingBlob, this.inlineFileName || `${this.inlineLang}-recording.webm`);
    fd.append('title', this.broadcastForm.title || 'Untitled');
    fd.append('language', this.inlineLang);
    fd.append('durationSeconds', String(this.inlineRecordingSeconds));
    fd.append('durationLabel', this.inlineRecordingLabel);

    this.isUploadingToLib = true;
    this.commService.uploadToAudioLibrary(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created: any) => {
          // Map uploaded audio into UI library/variant objects.
          const libItem = this.mapBackendAudioLibraryItemToUI(created);
          this.audioLibrary.unshift(libItem);

          const variant: AudioVariant = {
            language: libItem.language,
            blob: null,
            objectUrl: libItem.objectUrl,
            filePath: libItem.filePath,
            fileName: libItem.fileName,
            duration: libItem.duration,
            durationLabel: libItem.durationLabel,
            uploadStatus: 'done',
            uploadProgress: 100,
            listenCount: 0,
            reused: true,
            audioLibraryId: libItem.id
          };

          const existing = this.broadcastForm.selectedVariants.findIndex(v => v.language === this.inlineLang);
          if (existing >= 0) this.broadcastForm.selectedVariants[existing] = variant;
          else this.broadcastForm.selectedVariants.push(variant);

          this.isUploadingToLib = false;
          this.toast('info', 'Recording saved to audio library.');
          this.resetInlineAudio();
          const next = this.availableInlineLangs[0];
          if (next) this.inlineLang = next;
        },
        error: () => {
          this.isUploadingToLib = false;
          this.toast('error', 'Failed to save recording to audio library.');
        }
      });
  }

  get languageCoverage(): { language: string; covered: boolean; variant: AudioVariant | null }[] {
  return this.supportedLanguages.map(lang => ({
    language: lang,
    covered: this.broadcastForm.selectedVariants.some(v => v.language === lang),
    variant: this.broadcastForm.selectedVariants.find(v => v.language === lang) || null
  }));
}

get uncoveredLanguages(): string[] {
  return this.languageCoverage.filter(l => !l.covered).map(l => l.language);
}

get coveragePercentage(): number {
  const covered = this.languageCoverage.filter(l => l.covered).length;
  return Math.round((covered / this.supportedLanguages.length) * 100);
}

  get canBroadcast(): boolean {
    return !!this.broadcastForm.title.trim() && this.broadcastForm.selectedVariants.length > 0;
  }

  broadcastAudio(): void {
    if (!this.canBroadcast) return;

    // All selected variants must already exist in the backend audio library
    // (inline recordings are uploaded via confirmInlineVariant()).
    const missing = this.broadcastForm.selectedVariants.filter(v => !v.audioLibraryId);
    if (missing.length > 0) {
      this.toast('warning', 'Please add/record audio variants before broadcasting.');
      return;
    }

    const payload = {
      title: this.broadcastForm.title,
      type: this.broadcastForm.type,
      targetAudience: this.broadcastForm.targetAudience,
      repeatSchedule: this.broadcastForm.repeatSchedule,
      // Backend expects `LocalDateTime`, and our form inputs provide:
      // - datetime-local => `YYYY-MM-DDTHH:mm`
      // - date => `YYYY-MM-DD`
      // Convert both to parseable ISO-like LocalDateTime strings.
      scheduleFor: this.broadcastForm.scheduleFor ? this.broadcastForm.scheduleFor : null,
      expiresAt: this.broadcastForm.expiresAt ? `${this.broadcastForm.expiresAt}T00:00:00` : null,
      autoPlay: this.broadcastForm.autoPlay,
      smsTranscription: this.broadcastForm.smsTranscription,
      emailEnabled: true,
      scriptTemplateId: this.broadcastForm.scriptTemplateId || null,
      variants: this.broadcastForm.selectedVariants.map(v => ({
        audioLibraryId: v.audioLibraryId!,
        language: v.language
      }))
    };

    this.isBroadcasting = true;
    this.uploadProgress = 0;
    this.commService.createBroadcast(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isBroadcasting = false;
        this.uploadProgress = 100;
        this.toast('success', `"${this.broadcastForm.title}" broadcast created.`);
        this.closeBroadcastModal();
        this.loadBroadcasts();
        this.loadAudioLibrary();
        // Broadcast creation doesn't change SMS delivery rate, but refresh stats anyway.
        this.loadStatistics();
      },
      error: () => {
        this.isBroadcasting = false;
        this.toast('error', 'Failed to create broadcast.');
      }
    });
  }

  private finalizeBroadcast(): void {
    const pv = this.broadcastForm.selectedVariants[0];
    const nb: Broadcast = {
      id: Date.now(), title: this.broadcastForm.title, type: this.broadcastForm.type,
      language: pv.language, variants: [...this.broadcastForm.selectedVariants],
      duration: pv.duration, durationLabel: pv.durationLabel, listeners: 0, date: new Date(),
      expiresAt: this.broadcastForm.expiresAt ? new Date(this.broadcastForm.expiresAt) : undefined,
      status: this.broadcastForm.scheduleFor ? 'scheduled' : 'sent',
      repeatSchedule: this.broadcastForm.repeatSchedule, targetAudience: this.broadcastForm.targetAudience,
      autoPlay: this.broadcastForm.autoPlay, smsTranscription: this.broadcastForm.smsTranscription,
      emailEnabled: true, scriptTemplateId: this.broadcastForm.scriptTemplateId || undefined,
      playbackState: 'stopped', playbackProgress: 0
    };
    // Increment usageCount on library items used
    nb.variants.filter(v => v.reused && v.audioLibraryId).forEach(v => {
      const lib = this.audioLibrary.find(a => a.id === v.audioLibraryId);
      if (lib) lib.usageCount++;
    });
    this.broadcasts.unshift(nb);
    this.metrics.audioMessages.value++;
    this.metrics.totalMessages.value++;
    this.isBroadcasting = false;
    this.toast('success', `"${nb.title}" broadcast in ${nb.variants.length} language(s)!`);
    setTimeout(() => this.closeBroadcastModal(), 1500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3 — ALERTS
  // ═══════════════════════════════════════════════════════════════════════════

  alerts: AlertItem[] = [];
  isLoadingAlerts = false;

  alertSearch = '';
  alertStatusFilter: 'all' | 'active' | 'sent' = 'all';
  alertStats = { total: 0, active: 0, sent: 0, critical: 0 };

  readonly priorityChannelDefaults: Record<string, string[]> = {
    critical:    ['sms', 'email'],
    warning:     ['sms'],
    information: ['sms'],
    low:         [],
  };

  recalcAlertStats(): void {
    const f = this.filteredAlerts;
    this.alertStats = { total: f.length, active: f.filter(a => a.status === 'active').length, sent: f.filter(a => a.status === 'sent').length, critical: f.filter(a => a.priority === 'critical').length };
  }

  private mapBackendAlertType(type: any): AlertItem['type'] {
    const t = String(type ?? '').toUpperCase();
    if (t === 'WEATHER_ALERT') return 'weather';
    if (t === 'PAYMENT_REMINDER') return 'payment';
    if (t === 'PRICE_ALERT') return 'price';
    // Backend has TRAINING_ANNOUNCEMENT / GENERAL, but the dashboard UI uses fewer categories.
    return 'info';
  }

  private mapBackendAlertPriority(priority: any): AlertItem['priority'] {
    const p = String(priority ?? '').toUpperCase();
    if (p === 'CRITICAL') return 'critical';
    if (p === 'WARNING') return 'warning';
    return 'information';
  }

  private mapBackendAlertStatus(status: any): AlertItem['status'] {
    const s = String(status ?? '').toUpperCase();
    if (s === 'ACTIVE') return 'active';
    if (s === 'SENT') return 'sent';
    if (s === 'EXPIRED') return 'sent';
    return 'active';
  }

  private mapBackendAlertChannels(channels: any): string[] {
    if (!Array.isArray(channels)) return [];
    return channels.map((c: any) => String(c).toLowerCase()).map(c => {
      if (c === 'sms') return 'sms';
      if (c === 'audio') return 'audio';
      if (c === 'email') return 'email';
      // Backend typically stores channels as uppercase enum-like strings.
      if (c === 'sms' || c === 'SMS'.toLowerCase()) return 'sms';
      if (c === 'audio'.toLowerCase() || c === 'AUDIO'.toLowerCase()) return 'audio';
      if (c === 'email'.toLowerCase() || c === 'EMAIL'.toLowerCase()) return 'email';
      return c;
    });
  }

  private mapBackendAlertToUI(a: any): AlertItem {
    return {
      id: String(a?.alertId ?? a?.id ?? ''),
      type: this.mapBackendAlertType(a?.type),
      priority: this.mapBackendAlertPriority(a?.priority),
      title: String(a?.title ?? ''),
      description: String(a?.content ?? ''),
      recipients: Number(a?.recipientCount ?? 0),
      regions: ['All'],
      channels: this.mapBackendAlertChannels(a?.channels),
      deliveryRate: Number(a?.deliveryRate ?? 0),
      date: a?.createdAt ? new Date(a.createdAt) : new Date(),
      status: this.mapBackendAlertStatus(a?.status),
      createdBy: 'communication',
      scriptTemplateId: '',
      audioLibraryId: undefined
    };
  }

  loadAlerts(): void {
    this.isLoadingAlerts = true;
    this.commService.getAlertHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items: any[]) => {
          this.alerts = (items ?? []).map(x => this.mapBackendAlertToUI(x));
          this.isLoadingAlerts = false;
          this.recalcAlertStats();
        },
        error: () => {
          this.isLoadingAlerts = false;
          this.toast('error', 'Failed to load alerts.');
        }
      });
  }

  get filteredAlerts(): AlertItem[] {
    const q = this.alertSearch.trim().toLowerCase();
    const result = this.alerts.filter(a =>
      (this.alertStatusFilter === 'all' || a.status === this.alertStatusFilter) &&
      (!q || [a.title, a.description, a.id, a.type].some(s => s.toLowerCase().includes(q)))
    );
    if (this.alertPager.totalPages(result.length) < this.alertPager.page) this.alertPager.reset();
    return result;
  }

  get pagedAlerts(): AlertItem[] { return this.alertPager.slice(this.filteredAlerts); }

  showAlertModal      = false;
  showEditAlertModal  = false;
  editingAlertId      = '';
  selectedAlert: AlertItem | null = null;
  showAlertDetail     = false;
  isSendingAlert      = false;
  isSavingAlert       = false;

  alertForm = {
    type: 'weather', priority: 'warning', title: '', description: '',
    audience: 'ALL_MEMBERS', channels: ['sms'] as string[],
    expiryDate: '', scriptTemplateId: '',
    audioLibraryId: null as number | null
  };

  // ── Audio library integration for alerts ─────────────────────────────────────
  alertAudioSearch     = '';
  alertAudioLangFilter = 'all';

  private alertPreviewAudio: HTMLAudioElement | null = null;
  playingAlertAudioId: number | null = null;

  get filteredAlertAudio(): AudioLibraryItem[] {
    const q = this.alertAudioSearch.trim().toLowerCase();
    return this.audioLibrary.filter(a =>
      (this.alertAudioLangFilter === 'all' || a.language === this.alertAudioLangFilter) &&
      (!q || a.title.toLowerCase().includes(q) || a.language.toLowerCase().includes(q))
    );
  }

  get selectedAlertAudioTitle(): string {
    return this.audioLibrary.find(a => a.id === this.alertForm.audioLibraryId)?.title ?? '';
  }

  get selectedAlertAudioLanguage(): string {
    return this.audioLibrary.find(a => a.id === this.alertForm.audioLibraryId)?.language ?? '';
  }

  selectAlertAudio(item: AudioLibraryItem): void {
    this.alertForm.audioLibraryId = item.id;
    this.stopAlertAudioPreview();
  }

  clearAlertAudio(): void {
    this.alertForm.audioLibraryId = null;
    this.stopAlertAudioPreview();
  }

  toggleAlertAudioPreview(item: AudioLibraryItem): void {
    if (!item.objectUrl) {
      this.toast('info', 'Audio stored on server — playback unavailable in demo.');
      return;
    }
    if (this.playingAlertAudioId === item.id) {
      this.stopAlertAudioPreview();
      return;
    }
    this.stopAlertAudioPreview();
    this.alertPreviewAudio = new Audio(item.objectUrl);
    this.playingAlertAudioId = item.id;
    this.alertPreviewAudio.play();
    this.alertPreviewAudio.onended = () => {
      this.playingAlertAudioId = null;
      this.cdr.markForCheck();
    };
  }

  private stopAlertAudioPreview(): void {
    this.alertPreviewAudio?.pause();
    this.alertPreviewAudio = null;
    this.playingAlertAudioId = null;
  }

  onAlertPriorityChange(priority: string): void {
    this.alertForm.channels = [...(this.priorityChannelDefaults[priority] ?? [])];
  }
  toggleAlertChannel(ch: string): void {
    const idx = this.alertForm.channels.indexOf(ch);
    idx === -1 ? this.alertForm.channels.push(ch) : this.alertForm.channels.splice(idx, 1);
  }
  isAlertChannelActive(ch: string): boolean { return this.alertForm.channels.includes(ch); }
  get canSendAlert(): boolean {
    return !!this.alertForm.title.trim() && !!this.alertForm.description.trim();
  }

  openAlertModal(): void {
    this.alertForm = {
      type: 'weather', priority: 'warning', title: '', description: '',
      audience: 'ALL_MEMBERS', channels: [...this.priorityChannelDefaults['warning']],
      expiryDate: '', scriptTemplateId: '',
      audioLibraryId: null
    };
    this.alertAudioSearch = '';
    this.alertAudioLangFilter = 'all';
    this.showAlertModal = true;
  }

  closeAlertModal(): void {
    this.stopAlertAudioPreview();
    this.showAlertModal = false;
  }

  sendAlert(): void {
    if (!this.canSendAlert) return;
    if (!this.alertForm.channels || this.alertForm.channels.length === 0) {
      this.toast('warning', 'Select at least one delivery channel.');
      return;
    }
    this.isSendingAlert = true;
    const typeMap: Record<string, string> = {
      weather: 'WEATHER_ALERT',
      payment: 'PAYMENT_REMINDER',
      price: 'PRICE_ALERT',
      training: 'TRAINING_ANNOUNCEMENT',
      security: 'GENERAL',
      emergency: 'GENERAL',
      maintenance: 'GENERAL',
      info: 'GENERAL'
    };
    const priorityMap: Record<string, string> = {
      critical: 'CRITICAL',
      warning: 'WARNING',
      information: 'INFORMATION',
      low: 'INFORMATION'
    };
    const targetAudienceMap: Record<string, string> = {
      ALL_MEMBERS: 'ALL_MEMBERS',
      ACTIVE_MEMBERS: 'ACTIVE_MEMBERS',
      ZONE_1: 'DOUALA_ZONE',
      ZONE_2: 'YAOUNDE_ZONE'
    };
    const channelsMap: Record<string, string> = {
      sms: 'SMS',
      audio: 'AUDIO',
      email: 'EMAIL'
    };

    const alertPayload = {
      title:          this.alertForm.title,
      content:        this.alertForm.description,
      type:           typeMap[this.alertForm.type] ?? 'GENERAL',
      priority:       priorityMap[this.alertForm.priority] ?? 'INFORMATION',
      targetAudience: targetAudienceMap[this.alertForm.audience] ?? 'ALL_MEMBERS',
      channels:       this.alertForm.channels.map(ch => channelsMap[ch] ?? ch),
    } as {
      title: string;
      content: string;
      type: string;
      priority: string;
      targetAudience: string;
      channels: string[];
      specificZone?: string;
    };

    this.commService.createAlert(alertPayload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Some backend endpoints return the response but we typed as any.
        this.isSendingAlert = false;
        this.toast('success', `Alert "${this.alertForm.title}" sent!`);
        this.closeAlertModal();
        this.loadAlerts();
      },
      error: () => {
        this.isSendingAlert = false;
        this.toast('error', 'Failed to send alert.');
      }
    });
  }

  openEditAlert(alert: AlertItem): void {
    this.editingAlertId = alert.id;
    this.alertForm = {
      type: alert.type, priority: alert.priority, title: alert.title,
      description: alert.description, audience: 'ALL_MEMBERS',
      channels: [...alert.channels], expiryDate: '',
      scriptTemplateId: alert.scriptTemplateId ?? '',
      audioLibraryId: alert.audioLibraryId ?? null
    };
    this.showEditAlertModal = true;
  }
  closeEditAlertModal(): void { this.showEditAlertModal = false; this.editingAlertId = ''; }

  updateAlert(): void {
    if (!this.alertForm.title.trim()) { this.toast('warning', 'Title is required.'); return; }
    this.isSavingAlert = true;
    const typeMap: Record<string, string> = {
      weather: 'WEATHER_ALERT',
      payment: 'PAYMENT_REMINDER',
      price: 'PRICE_ALERT',
      training: 'TRAINING_ANNOUNCEMENT',
      security: 'GENERAL',
      emergency: 'GENERAL',
      maintenance: 'GENERAL',
      info: 'GENERAL'
    };
    const priorityMap: Record<string, string> = {
      critical: 'CRITICAL',
      warning: 'WARNING',
      information: 'INFORMATION',
      low: 'INFORMATION'
    };
    const targetAudienceMap: Record<string, string> = {
      ALL_MEMBERS: 'ALL_MEMBERS',
      ACTIVE_MEMBERS: 'ACTIVE_MEMBERS',
      ZONE_1: 'DOUALA_ZONE',
      ZONE_2: 'YAOUNDE_ZONE'
    };
    const channelsMap: Record<string, string> = {
      sms: 'SMS',
      audio: 'AUDIO',
      email: 'EMAIL'
    };

    const payload = {
      title:          this.alertForm.title,
      content:        this.alertForm.description,
      type:           typeMap[this.alertForm.type] ?? 'GENERAL',
      priority:       priorityMap[this.alertForm.priority] ?? 'INFORMATION',
      targetAudience: targetAudienceMap[this.alertForm.audience] ?? 'ALL_MEMBERS',
      channels:       this.alertForm.channels.map(ch => channelsMap[ch] ?? ch),
    } as {
      title: string;
      content: string;
      type: string;
      priority: string;
      targetAudience: string;
      channels: string[];
      specificZone?: string;
    };

    this.commService.updateAlert(this.editingAlertId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          this.isSavingAlert = false;
          this.toast('success', 'Alert updated.');
          this.closeEditAlertModal();
          // Ensure UI is consistent with backend
          this.loadAlerts();
        },
        error: () => {
          this.isSavingAlert = false;
          this.toast('error', 'Failed to update alert.');
        }
      });
  }

  deleteAlert(id: string): void {
    if (!confirm(`Delete alert ${id}?`)) return;
    this.commService.deleteAlert(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast('success', `Alert ${id} deleted.`);
        this.loadAlerts();
      },
      error: () => this.toast('error', `Failed to delete alert ${id}.`)
    });
  }

  markAlertSent(id: string): void {
    this.commService.markAlertSent(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast('success', 'Alert marked as sent.');
        this.loadAlerts();
      },
      error: () => this.toast('error', 'Failed to mark alert as sent.')
    });
  }

  viewAlertDetail(alert: AlertItem): void { this.selectedAlert = alert; this.showAlertDetail = true; }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 4 — TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  templates: MsgTemplate[] = [];
  isLoadingTemplates = false;

  templateSearch = '';
  templateCategoryFilter = 'all';

  private mapBackendTemplateToUI(t: any): MsgTemplate {
    const content = String(t?.content ?? '');
    return {
      id: String(t?.id ?? ''),
      title: String(t?.name ?? ''),
      description: content ? (content.length > 80 ? content.slice(0, 80) + '…' : content) : '',
      content,
      type: 'text',
      category: 'general',
      language: 'Multiple',
      createdDate: '',
      usageCount: 0
    };
  }

  loadTemplates(): void {
    this.isLoadingTemplates = true;
    this.commService.getAllTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items: any[]) => {
          this.templates = (items ?? []).map(x => this.mapBackendTemplateToUI(x));
          this.isLoadingTemplates = false;
        },
        error: () => {
          this.isLoadingTemplates = false;
          this.toast('error', 'Failed to load templates.');
        }
      });
  }

  get filteredTemplates(): MsgTemplate[] {
    const q = this.templateSearch.trim().toLowerCase();
    const result = this.templates.filter(t =>
      (this.templateCategoryFilter === 'all' || t.category === this.templateCategoryFilter) &&
      (!q || [t.title, t.description, t.category, t.language].some(s => s.toLowerCase().includes(q)))
    );
    if (this.templatePager.totalPages(result.length) < this.templatePager.page) this.templatePager.reset();
    return result;
  }

  get pagedTemplates(): MsgTemplate[] { return this.templatePager.slice(this.filteredTemplates); }

  showTemplateModal      = false;
  showEditTemplateModal  = false;
  editingTemplateId      = '';
  isSavingEditTemplate   = false;

  templateForm     = { name: '', category: '', language: '', content: '' };
  editTemplateForm = { name: '', category: '', language: '', content: '' };
  templatePreview     = '';
  editTemplatePreview = '';

  readonly templateVars = ['(name)','(id)','(balance)','(amount)','(date)','(time)','(location)','(product)','(quantity)','(venue)'];
  private readonly previewVarMap: Record<string, string> = {
    '(name)': 'Jean Dupont', '(id)': 'FARM12345', '(balance)': '15,000 XAF',
    '(amount)': '5,000 XAF', '(date)': '15 Mar 2025', '(time)': '14:30',
    '(location)': 'Zone 3', '(product)': 'NPK Fertilizer', '(quantity)': '5 sacs', '(venue)': 'Cooperative Office'
  };

  openTemplateModal():  void { this.showTemplateModal = true; this.templateForm = { name:'', category:'', language:'', content:'' }; this.templatePreview = ''; }
  closeTemplateModal(): void { this.showTemplateModal = false; }

  updateTemplatePreview(): void { let p = this.templateForm.content; Object.entries(this.previewVarMap).forEach(([k,v]) => p = p.replaceAll(k,v)); this.templatePreview = p; }
  insertVariable(v: string):  void { this.templateForm.content += v + ' '; this.updateTemplatePreview(); }

  private extractTemplateVariables(content: string): string[] {
    if (!content) return [];
    const matches = content.match(/\([a-zA-Z0-9_]+\)/g) ?? [];
    return Array.from(new Set(matches));
  }

  saveTemplate(): void {
    if (!this.templateForm.name.trim() || !this.templateForm.category || !this.templateForm.language) { this.toast('warning', 'Name, category, and language are required.'); return; }
    const variables = this.extractTemplateVariables(this.templateForm.content);
    this.commService.createTemplate({
      name: this.templateForm.name,
      title: this.templateForm.name,
      content: this.templateForm.content,
      category: this.templateForm.category,
      language: this.templateForm.language,
      variables
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast('success', 'Template saved!');
        this.closeTemplateModal();
        this.loadTemplates();
      },
      error: () => this.toast('error', 'Failed to save template.')
    });
  }

  openEditTemplate(tpl: MsgTemplate): void {
    this.editingTemplateId = tpl.id;
    this.editTemplateForm = { name: tpl.title, category: tpl.category, language: tpl.language, content: tpl.content };
    this.updateEditTemplatePreview(); this.showEditTemplateModal = true;
  }
  closeEditTemplateModal(): void { this.showEditTemplateModal = false; this.editingTemplateId = ''; this.editTemplateForm = { name:'', category:'', language:'', content:'' }; this.editTemplatePreview = ''; }

  updateEditTemplatePreview(): void { let p = this.editTemplateForm.content; Object.entries(this.previewVarMap).forEach(([k,v]) => p = p.replaceAll(k,v)); this.editTemplatePreview = p; }
  insertEditVariable(v: string): void { this.editTemplateForm.content += v + ' '; this.updateEditTemplatePreview(); }

  updateTemplate(): void {
    if (!this.editTemplateForm.name.trim() || !this.editTemplateForm.category || !this.editTemplateForm.language) { this.toast('warning', 'Name, category, and language are required.'); return; }
    this.isSavingEditTemplate = true;
    const templateIdNum = Number(this.editingTemplateId);
    if (!Number.isFinite(templateIdNum)) {
      this.isSavingEditTemplate = false;
      this.toast('error', 'Invalid template id.');
      return;
    }

    const variables = this.extractTemplateVariables(this.editTemplateForm.content);
    this.commService.updateTemplate(templateIdNum, {
      name: this.editTemplateForm.name,
      content: this.editTemplateForm.content,
      variables
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSavingEditTemplate = false;
        this.toast('success', 'Template updated.');
        this.closeEditTemplateModal();
        this.loadTemplates();
      },
      error: () => {
        this.isSavingEditTemplate = false;
        this.toast('error', 'Failed to update template.');
      }
    });
  }

  deleteTemplate(tpl: MsgTemplate): void {
    if (!confirm(`Delete template "${tpl.title}"?`)) return;
    const templateIdNum = Number(tpl.id);
    if (!Number.isFinite(templateIdNum)) {
      this.toast('error', 'Invalid template id.');
      return;
    }
    this.commService.deleteTemplate(templateIdNum).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast('success', 'Template deleted.');
        this.loadTemplates();
      },
      error: () => this.toast('error', 'Failed to delete template.')
    });
  }

  loadSupportedLanguages(): void {
  this.commService.getSupportedLanguages()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (languages: string[]) => {
        this.supportedLanguages = languages;
        // Set default inline language to first available
        if (languages.length > 0) {
          this.inlineLang = languages[0];
          this.libForm.language = languages[0];
        }
      },
      error: () => {
        // Fallback to hardcoded if API fails
        this.supportedLanguages = ['French', 'English', 'Fulfulde', 'Ewondo', 'Duala'];
      }
    });
}

  // ─── Utilities ────────────────────────────────────────────────────────────

  getTypeIcon(t: AnnouncementType):  string { return this.announcementTypes.find(x => x.value === t)?.icon  ?? 'fas fa-bullhorn'; }
  getTypeLabel(t: AnnouncementType): string { return this.announcementTypes.find(x => x.value === t)?.label ?? t; }
  getTypeColor(t: AnnouncementType): string { return this.announcementTypes.find(x => x.value === t)?.color ?? '#64748b'; }

  getAlertIcon(type: string): string {
    return ({'weather':'fas fa-cloud-rain','payment':'fas fa-money-bill-wave','price':'fas fa-chart-line','security':'fas fa-shield-alt','maintenance':'fas fa-tools','emergency':'fas fa-exclamation-triangle','info':'fas fa-info-circle'} as Record<string,string>)[type] ?? 'fas fa-bell';
  }

  priorityClass(p: string): string {
    return ({'critical':'badge-critical','warning':'badge-warning','information':'badge-info','info':'badge-info','low':'badge-low'} as Record<string,string>)[p] ?? 'badge-low';
  }

  statusClass(s: string): string {
    return ({'active':'badge-active','sent':'badge-sent','draft':'badge-draft','failed':'badge-failed','scheduled':'badge-scheduled'} as Record<string,string>)[s] ?? 'badge-draft';
  }

  formatDate(d: Date | string): string {
    const dt = new Date(d); const now = new Date(); const diffH = (now.getTime() - dt.getTime()) / 3_600_000;
    if (diffH < 1) return 'Just now'; if (diffH < 24) return `${Math.floor(diffH)}h ago`; if (diffH < 48) return 'Yesterday';
    return dt.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  capitalize(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  templateTitle(id: string): string { return this.templates.find(t => t.id === id)?.title ?? '—'; }

  exportCSV(): void {
    const rows = [
      ['Title','Type','Languages','Listeners','Date','Status'],
      ...this.broadcasts.map(b => [b.title, b.type, b.variants.map(v => v.language).join(';'), String(b.listeners), b.date.toLocaleDateString(), b.status])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `broadcasts-${this.today}.csv`; a.click(); this.toast('success', 'CSV exported.');
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  constructor(private commService: CommunicationService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.loadSupportedLanguages();
    this.recalcAlertStats();
    this.loadAlerts();
    this.loadTemplates();
    this.loadAudioLibrary();
    this.loadStatistics();
    this.loadBroadcasts();
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    if (this.libRecordTimer)    clearInterval(this.libRecordTimer);
    if (this.inlineRecordTimer) clearInterval(this.inlineRecordTimer);
    if (this.libInterval)       clearInterval(this.libInterval);
    if (this.libraryInterval)   clearInterval(this.libraryInterval);
    this.stopLibWaveform(); this.stopInlineWaveform();
    this.resetLibPreListen(); this.resetInlinePreListen();
    this.stopAlertAudioPreview();
    this.libAudio?.pause();
    this.libraryAudio?.pause();
    if (this.libPendingObjectUrl)    URL.revokeObjectURL(this.libPendingObjectUrl);
    if (this.inlinePendingObjectUrl) URL.revokeObjectURL(this.inlinePendingObjectUrl);
  }
}
