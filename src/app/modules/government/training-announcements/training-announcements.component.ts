import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TrainingAnnouncement {
  id: string;
  title: string;
  languages: string[];
  targetAudience: string;
  regions: string[];
  crops: string[];
  scheduleDate: Date | null;
  status: 'Draft' | 'Scheduled' | 'Sent';
  reachCount?: number;
  engagementRate?: number;
  audioUrl?: string | null;       
}

export interface QuickTemplate {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-training-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './training-announcements.component.html',
  styleUrls: ['./training-announcements.component.scss']
})
export class TrainingAnnouncementsComponent implements OnInit {

  // ── Form State ──────────────────────────────────────────────
  title = '';
  isRecording = false;
  recordingLanguage = 'French';
  targetAudience = 'All Farmers';
  selectedRegions: string[] = [];
  selectedCrops: string[] = [];
  selectedLanguages: string[] = ['French'];
  scheduleDateStr = '';

  // Edit mode
  editingId: string | null = null;

  // Recording state
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  recordedAudioUrl: string | null = null;    // URL for the audio of the current form

  // ── Static Reference Data ───────────────────────────────────
  readonly languages: string[] = ['French', 'English', 'Fulfulde', 'Ewondo', 'Duala'];

  readonly regions: string[] = [
    'Centre', 'Littoral', 'West', 'South-West', 'North-West',
    'Adamawa', 'North', 'Far North', 'East', 'South'
  ];

  readonly crops: string[] = [
    'Cocoa', 'Coffee', 'Palm Oil', 'Cotton',
    'Cassava', 'Maize', 'Plantain', 'Rice'
  ];

  readonly quickTemplates: QuickTemplate[] = [
    {
      title: 'Seasonal Planting Guide',
      description: 'Pre-configured for current season',
      icon: '🌱'
    },
    {
      title: 'Emergency Weather Alert',
      description: 'Rapid deployment for weather warnings',
      icon: '⛈️'
    },
    {
      title: 'Market Price Update',
      description: 'Linked to latest price changes',
      icon: '💰'
    },
    {
      title: 'Disease Outbreak Warning',
      description: 'Emergency health alerts',
      icon: '🦠'
    }
  ];

  // ── Announcements List ──────────────────────────────────────
  announcements: TrainingAnnouncement[] = [
    {
      id: '1',
      title: 'Cocoa Pest Control Training',
      languages: ['French', 'English'],
      targetAudience: 'Crop Specific',
      regions: ['Centre', 'South-West'],
      crops: ['Cocoa'],
      scheduleDate: new Date(),
      status: 'Sent',
      reachCount: 15247,
      engagementRate: 78
    },
    {
      id: '2',
      title: 'Seasonal Planting Guide - Rainy Season',
      languages: ['French', 'Fulfulde'],
      targetAudience: 'All Farmers',
      regions: [],
      crops: [],
      scheduleDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'Scheduled',
      reachCount: 0,
      engagementRate: 0
    },
    {
      id: '3',
      title: 'Financial Management for Small Farmers',
      languages: ['French'],
      targetAudience: 'Specific Regions',
      regions: ['North', 'Far North'],
      crops: [],
      scheduleDate: null,
      status: 'Draft',
      reachCount: 0,
      engagementRate: 0
    }
  ];

  // ── Computed Helpers ────────────────────────────────────────
  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get scheduleDate(): Date | undefined {
    return this.scheduleDateStr ? new Date(this.scheduleDateStr) : undefined;
  }

  // ── Lifecycle ───────────────────────────────────────────────
  ngOnInit(): void {}

  // ── Recording ───────────────────────────────────────────────
  async handleRecord(): Promise<void> {
  if (!this.isRecording) {
    // Start recording...
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        if (this.recordedAudioUrl) {
          URL.revokeObjectURL(this.recordedAudioUrl);
        }
        this.recordedAudioUrl = URL.createObjectURL(audioBlob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        // The UI is already showing 'Record' because we set isRecording = false immediately.
        // Ensure it stays false.
        this.isRecording = false;
      };

      this.mediaRecorder.start();
      this.isRecording = true;  // UI shows 'Stop Recording'
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      alert('Unable to access microphone. Please allow microphone access and try again.');
    }
  } else {
    // Stop recording – update UI immediately
    this.isRecording = false;   // ← Changes button text instantly
    this.mediaRecorder?.stop(); // This will eventually trigger onstop to clean up
    this.mediaRecorder = null;
  }
}

  // ── Multi-Select Toggles ────────────────────────────────────
  toggleLanguage(lang: string): void {
    this.selectedLanguages = this.selectedLanguages.includes(lang)
      ? this.selectedLanguages.filter(l => l !== lang)
      : [...this.selectedLanguages, lang];
  }

  toggleRegion(region: string): void {
    this.selectedRegions = this.selectedRegions.includes(region)
      ? this.selectedRegions.filter(r => r !== region)
      : [...this.selectedRegions, region];
  }

  toggleCrop(crop: string): void {
    this.selectedCrops = this.selectedCrops.includes(crop)
      ? this.selectedCrops.filter(c => c !== crop)
      : [...this.selectedCrops, crop];
  }

  // ── Estimated Reach ─────────────────────────────────────────
  getEstimatedReach(): string {
    switch (this.targetAudience) {
      case 'All Farmers':
        return '127,543';
      case 'Specific Regions':
        return (this.selectedRegions.length * 12000).toLocaleString();
      case 'Crop Specific':
        return (this.selectedCrops.length * 8000).toLocaleString();
      default:
        return '0';
    }
  }

  // ── Create or Update Announcement ───────────────────────────
  createOrUpdateAnnouncement(): void {
    if (!this.title.trim()) return;

    if (this.editingId) {
      // Update existing announcement
      this.announcements = this.announcements.map(item =>
        item.id === this.editingId
          ? {
              ...item,
              title: this.title,
              languages: [...this.selectedLanguages],
              targetAudience: this.targetAudience,
              regions: this.targetAudience === 'Specific Regions' ? [...this.selectedRegions] : [],
              crops: this.targetAudience === 'Crop Specific' ? [...this.selectedCrops] : [],
              scheduleDate: this.scheduleDate ?? null,
              // Keep existing audio if not re‑recorded, otherwise use new one
              audioUrl: this.recordedAudioUrl || item.audioUrl
            }
          : item
      );
    } else {
      // Create new announcement
      const newAnnouncement: TrainingAnnouncement = {
        id: Date.now().toString(),
        title: this.title,
        languages: [...this.selectedLanguages],
        targetAudience: this.targetAudience,
        regions: this.targetAudience === 'Specific Regions' ? [...this.selectedRegions] : [],
        crops: this.targetAudience === 'Crop Specific' ? [...this.selectedCrops] : [],
        scheduleDate: this.scheduleDate ?? null,
        status: 'Draft',
        reachCount: 0,
        engagementRate: 0,
        audioUrl: this.recordedAudioUrl
      };
      this.announcements = [newAnnouncement, ...this.announcements];
    }

    this.resetForm();
  }

  private resetForm(): void {
    this.title = '';
    this.selectedLanguages = ['French'];
    this.targetAudience = 'All Farmers';
    this.selectedRegions = [];
    this.selectedCrops = [];
    this.scheduleDateStr = '';
    this.editingId = null;

    // Clean up recorded audio
    if (this.recordedAudioUrl) {
      URL.revokeObjectURL(this.recordedAudioUrl);
      this.recordedAudioUrl = null;
    }
    if (this.mediaRecorder) {
      if (this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
      this.mediaRecorder = null;
    }
    this.audioChunks = [];
  }

  // ── Send Announcement ───────────────────────────────────────
  sendAnnouncement(id: string): void {
    this.announcements = this.announcements.map(item =>
      item.id === id
        ? {
            ...item,
            status: 'Sent' as const,
            reachCount: Math.floor(Math.random() * 20000) + 10000,
            engagementRate: Math.floor(Math.random() * 30) + 60
          }
        : item
    );
  }

  // ── Apply Quick Template ────────────────────────────────────
  applyTemplate(template: QuickTemplate): void {
    this.title = template.title;
  }

  // ── Edit Announcement ───────────────────────────────────────
  editAnnouncement(id: string): void {
    const announcement = this.announcements.find(a => a.id === id);
    if (!announcement) return;

    this.editingId = id;
    this.title = announcement.title;
    this.selectedLanguages = [...announcement.languages];
    this.targetAudience = announcement.targetAudience;
    this.selectedRegions = [...announcement.regions];
    this.selectedCrops = [...announcement.crops];
    this.scheduleDateStr = announcement.scheduleDate
      ? announcement.scheduleDate.toISOString().split('T')[0]
      : '';

    // If there is an existing audio URL, we could keep it, but for simplicity we don't pre‑load it into the recorder.
    // The user can re‑record if they want to change it.
    // For now, we don't set recordedAudioUrl; the existing audio stays untouched unless the user records a new one.
    // Optionally, you could clear recordedAudioUrl so that the old one is not overwritten unless recorded.
    if (this.recordedAudioUrl) {
      URL.revokeObjectURL(this.recordedAudioUrl);
      this.recordedAudioUrl = null;
    }

    // Scroll the form into view
    const form = document.querySelector('.creation-grid');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Play Audio ──────────────────────────────────────────────
  playAudio(id: string): void {
    const announcement = this.announcements.find(a => a.id === id);
    if (!announcement || !announcement.audioUrl) {
      alert('No audio recorded for this announcement.');
      return;
    }

    const audio = new Audio(announcement.audioUrl);
    audio.play().catch(err => {
      console.error('Audio playback failed:', err);
      alert('Could not play audio.');
    });
  }

  // ── Status Helpers ──────────────────────────────────────────
  getStatusClass(status: string): Record<string, boolean> {
    return {
      'status-badge--sent':      status === 'Sent',
      'status-badge--scheduled': status === 'Scheduled',
      'status-badge--draft':     status === 'Draft'
    };
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      Sent: '✅',
      Scheduled: '🕐',
      Draft: '⚠️'
    };
    return icons[status] ?? '🕐';
  }
}