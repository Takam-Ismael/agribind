import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PlantHealthService, DiseaseReport, PlantHealthSummary, DiseaseReportSummary } from './plant-health.service';

// ─── Leaflet typings (leaflet must be listed in angular.json scripts/styles) ──
declare const L: any;

// ── Disease trend data ────────────────────────────────────────────────────────
interface DiseaseTrend {
  disease:   string;
  crop:      string;
  region:    string;
  farms:     number;
  spreadPct: number;
  change:    string;
  direction: 'up' | 'down';
  severity:  'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const DISEASE_TRENDS: DiseaseTrend[] = [
  { disease: 'Black Pod Disease',    crop: 'Cocoa',   region: 'Centre, South',   farms: 18, spreadPct: 75, change: '+15%', direction: 'up',   severity: 'CRITICAL' },
  { disease: 'Coffee Leaf Rust',     crop: 'Coffee',  region: 'West, Northwest', farms: 12, spreadPct: 55, change: '+8%',  direction: 'up',   severity: 'HIGH'     },
  { disease: 'Maize Streak Virus',   crop: 'Maize',   region: 'Adamawa, North',  farms:  6, spreadPct: 38, change: '+5%',  direction: 'up',   severity: 'MEDIUM'   },
  { disease: 'Cassava Mosaic Virus', crop: 'Cassava', region: 'Littoral, East',  farms:  4, spreadPct: 28, change: '−5%',  direction: 'down', severity: 'LOW'      },
  { disease: 'Fusarium Wilt',        crop: 'Cotton',  region: 'Far North',       farms:  3, spreadPct: 22, change: '+3%',  direction: 'up',   severity: 'MEDIUM'   },
];

interface HealthStat {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  changeColor: string;
}

interface NewReportForm {
  farmerId: number | null;
  crop: string;
  disease: string;
  location: string;
  affectedArea: string;
  severity: string;
  reportDate: string;
  reportedBy: string;
  treatmentNotes: string;
  photos: File[];
}

interface TreatmentForm {
  treatmentType: string;
  treatmentDate: string;
  treatmentNotes: string;
  followUpDate: string;
  assignedExpert: string;
}

// ── Disease hotspot data for Cameroon ──────────────────────────────────────────
interface DiseaseHotspot {
  lat: number;
  lng: number;
  label: string;
  disease: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  farms: number;
}

const CAMEROON_HOTSPOTS: DiseaseHotspot[] = [
  { lat: 3.848, lng: 11.502, label: 'Centre Region',   disease: 'Black Pod Disease',   severity: 'CRITICAL', farms: 18 },
  { lat: 4.051, lng:  9.768, label: 'Littoral Region', disease: 'Cassava Mosaic Virus', severity: 'LOW',      farms:  4 },
  { lat: 4.153, lng:  9.240, label: 'Southwest',        disease: 'Coffee Leaf Rust',    severity: 'HIGH',     farms: 12 },
  { lat: 5.960, lng: 10.160, label: 'Northwest',        disease: 'Coffee Leaf Rust',    severity: 'HIGH',     farms:  8 },
  { lat: 5.479, lng: 10.418, label: 'West Region',      disease: 'Coffee Berry Disease',severity: 'MEDIUM',   farms:  6 },
  { lat: 7.327, lng: 13.584, label: 'Adamawa',          disease: 'Maize Streak Virus',  severity: 'MEDIUM',   farms:  4 },
  { lat: 9.303, lng: 13.396, label: 'North Region',     disease: 'Maize Streak Virus',  severity: 'MEDIUM',   farms:  2 },
  { lat: 11.87, lng: 14.920, label: 'Far North',        disease: 'Fusarium Wilt',       severity: 'MEDIUM',   farms:  3 },
  { lat: 2.913, lng: 11.283, label: 'South Region',     disease: 'Black Pod Disease',   severity: 'HIGH',     farms:  7 },
  { lat: 4.090, lng: 14.424, label: 'East Region',      disease: 'Cassava Mosaic Virus',severity: 'LOW',      farms:  2 },
];

const SEVERITY_COLOURS: Record<string, string> = {
  CRITICAL: '#e64a4a',
  HIGH:     '#e65100',
  MEDIUM:   '#a37e00',
  LOW:      '#059669',
};

@Component({
  selector: 'app-plant-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plant-health.component.html',
  styleUrls: ['./plant-health.component.scss']
})
export class PlantHealthComponent implements OnInit, AfterViewInit {

  @ViewChild('cameraInput')  cameraInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('galleryInput') galleryInputRef!: ElementRef<HTMLInputElement>;

  // ── User ──────────────────────────────────────────────────────────────────
  user = { name: '', role: '', initials: '', cooperativeId: '' };
  errorMessage = '';

  // ── Filters ───────────────────────────────────────────────────────────────
  selectedSeverity  = 'all';
  selectedCrop      = 'all';
  selectedStatus    = 'all';
  searchQuery       = '';
  activeStatusTab   = 'all';

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 0;
  pageSize    = 10;
  totalPages  = 0;

  // ── Loading ───────────────────────────────────────────────────────────────
  isLoading       = false;
  isLoadingStats  = false;

  // ── Data ──────────────────────────────────────────────────────────────────
  healthStats: HealthStat[] = [];
  diseaseReports: DiseaseReport[] = [];
  filteredDiseaseReports: DiseaseReport[] = [];
  // Expose static disease trend data to the template
  readonly diseaseTrends = DISEASE_TRENDS;

  // ── Modal states ──────────────────────────────────────────────────────────
  showReportModal  = false;
  showViewModal    = false;
  showTreatModal   = false;
  showEditModal    = false;
  showCameraModal  = false;
  showExportModal  = false;
  cameraStream: MediaStream | null = null;
  selectedReport: DiseaseReport | null = null;

  // ── Export ────────────────────────────────────────────────────────────────
  exportFormat: 'csv' | 'pdf' = 'csv';
  exportScope:  'table' | 'statistics' | 'both' = 'both';

  // ── Forms ─────────────────────────────────────────────────────────────────
  newReport: NewReportForm = {
    farmerId: null, crop: '', disease: '', location: '',
    affectedArea: '', severity: 'MEDIUM',
    reportDate: new Date().toISOString().split('T')[0],
    reportedBy: '', treatmentNotes: '', photos: []
  };

  reportForm = {
    farmerName: '', crop: '', disease: '',
    location: '', affectedArea: '', severity: '', image: null as File | null
  };

  treatmentForm: TreatmentForm = {
    treatmentType: '', treatmentDate: new Date().toISOString().split('T')[0],
    treatmentNotes: '', followUpDate: '', assignedExpert: ''
  };

  // ── Select options ────────────────────────────────────────────────────────
  severityOptions = [
    { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' }, { value: 'CRITICAL', label: 'Critical' }
  ];

  cropOptions = ['Cocoa','Coffee','Cotton','Palm Oil','Cassava','Maize','Rice','Banana','Pineapple'];

  diseaseOptions = [
    'Black Pod Disease','Coffee Berry Disease','Fusarium Wilt','Bacterial Blight',
    'Leaf Spot','Root Rot','Powdery Mildew','Downy Mildew','Anthracnose',
    'Cercospora Leaf Spot','Rust Disease','Blight','Wilt','Other'
  ];

  crops = [
    { value: 'all', label: 'All Crops' }, { value: 'cocoa', label: 'Cocoa' },
    { value: 'coffee', label: 'Coffee' }, { value: 'palmoil', label: 'Palm Oil' },
    { value: 'cotton', label: 'Cotton' }, { value: 'cassava', label: 'Cassava' },
    { value: 'maize', label: 'Maize' }
  ];

  severities = [
    { value: 'all', label: 'All Severities' }, { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' }, { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ];

  // ── Private: Leaflet map instance ─────────────────────────────────────────
  private _map: any = null;

  constructor(
    private authService: AuthService,
    private plantHealthService: PlantHealthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadHealthStats();
    this.loadDiseaseReports();
  }

  ngAfterViewInit(): void {
    // Load Leaflet CSS + JS dynamically, then initialise the map.
    this.loadLeaflet().then(() => this.initMap());
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Leaflet map (Cameroon)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Dynamically injects the Leaflet CSS and JS from CDN if not already present.
   * Returns a promise that resolves once Leaflet is ready to use.
   */
  private loadLeaflet(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof L !== 'undefined') { resolve(); return; }

      // CSS
      const css = document.getElementById('leaflet-css');
      if (!css) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // JS
      const existing = document.getElementById('leaflet-js');
      if (existing) { resolve(); return; }

      const script   = document.createElement('script');
      script.id      = 'leaflet-js';
      script.src     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload  = () => resolve();
      script.onerror = () => { console.error('Failed to load Leaflet'); resolve(); };
      document.body.appendChild(script);
    });
  }

  private initMap(): void {
    const el = document.getElementById('cameroon-disease-map');
    if (!el || this._map) return;

    try {
      // ── Cameroon: centre ≈ 5.5°N  12.3°E, zoom 6 shows the whole country ──
      this._map = L.map('cameroon-disease-map', {
        center: [5.5, 12.3],
        zoom: 6,
        zoomControl: true,
        attributionControl: true
      });

      // OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this._map);

      // Disease hotspot markers
      CAMEROON_HOTSPOTS.forEach(spot => {
        const colour = SEVERITY_COLOURS[spot.severity];

        // Circle marker sized by farm count
        const radius = Math.max(8, Math.min(20, spot.farms * 1.2));

        const circle = L.circleMarker([spot.lat, spot.lng], {
          radius,
          fillColor: colour,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(this._map);

        circle.bindPopup(`
          <div style="font-family:sans-serif;min-width:170px">
            <strong style="font-size:13px;">${spot.label}</strong><br/>
            <span style="color:#555;font-size:12px;">${spot.disease}</span><br/>
            <hr style="margin:6px 0;border:none;border-top:1px solid #eee"/>
            <span style="
              display:inline-block;
              background:${colour};
              color:#fff;
              padding:2px 8px;
              border-radius:12px;
              font-size:11px;
              font-weight:700;
              margin-bottom:4px;
            ">${spot.severity}</span><br/>
            <span style="font-size:12px;color:#333;">
              <strong>${spot.farms}</strong> farm${spot.farms !== 1 ? 's' : ''} affected
            </span>
          </div>
        `, { maxWidth: 220 });

        circle.bindTooltip(spot.label, { permanent: false, direction: 'top' });
      });

      // Force a resize so the tiles render correctly inside the flex card
      setTimeout(() => { this._map.invalidateSize(); }, 300);

    } catch (e) {
      console.error('Map init error:', e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Data loading
  // ──────────────────────────────────────────────────────────────────────────

  private loadUserInfo(): void {
    try {
      const user = this.authService.getCurrentUser() as any;
      if (!user) { this.setDefaultUserInfo(); return; }

      this.user = {
        name: user.name || '',
        role: user.role || '',
        initials: this.getInitials(user.name || ''),
        cooperativeId: user.cooperativeId || ''
      };
      this.newReport.reportedBy = user.name || '';
      this.newReport.farmerId   = user.id || null;

      if (!this.newReport.farmerId && user.cooperativeId) {
        const n = parseInt(user.cooperativeId, 10);
        if (!isNaN(n)) this.newReport.farmerId = n;
      }
    } catch { this.setDefaultUserInfo(); }
  }

  private setDefaultUserInfo(): void {
    this.user = { name: 'Guest User', role: 'Farmer', initials: 'GU', cooperativeId: '' };
    this.newReport.reportedBy = 'Guest User';
    this.newReport.farmerId   = null;
  }

  private loadHealthStats(): void {
    this.isLoadingStats = true;
    this.plantHealthService.getDiseaseReportSummary().subscribe({
      next: (summary: DiseaseReportSummary) => {
        this.healthStats = [
          { title: 'Active Cases',    value: summary.activeCases?.toString()  || '0', change: `${summary.criticalCases || 0} critical`, icon: '⚠️',  color: 'bg-warning',     changeColor: 'text-warning' },
          { title: 'Resolved Cases',  value: summary.resolvedCases?.toString() || '0', change: '+18 this month',     icon: '✅',  color: 'bg-success',     changeColor: 'text-success' },
          { title: 'Total Reports',   value: summary.totalReports?.toString()  || '0', change: 'All time',           icon: '📊',  color: 'bg-info',        changeColor: 'text-info' },
          { title: 'Critical Alerts', value: summary.criticalCases?.toString() || '0', change: 'Immediate attention',icon: '🔴',  color: 'bg-destructive', changeColor: 'text-destructive' }
        ];
        this.isLoadingStats = false;
      },
      error: () => { this.setDefaultHealthStats(); this.isLoadingStats = false; }
    });
  }

  private setDefaultHealthStats(): void {
    this.healthStats = [
      { title: 'Active Cases',    value: '0', change: '0 critical',          icon: '⚠️', color: 'bg-warning',     changeColor: 'text-warning' },
      { title: 'Resolved Cases',  value: '0', change: '+0 this month',       icon: '✅', color: 'bg-success',     changeColor: 'text-success' },
      { title: 'Total Reports',   value: '0', change: 'All time',            icon: '📊', color: 'bg-info',        changeColor: 'text-info' },
      { title: 'Critical Alerts', value: '0', change: 'No critical alerts',  icon: '🔴', color: 'bg-destructive', changeColor: 'text-destructive' }
    ];
  }

  private loadDiseaseReports(): void {
    this.isLoading = true;
    this.plantHealthService.getDiseaseReportsPaginated({ page: this.currentPage, size: this.pageSize }).subscribe({
      next: (response) => {
        this.diseaseReports = response.content || [];
        this.applyFilters();
        this.totalPages  = response.totalPages || 0;
        this.isLoading   = false;
      },
      error: () => {
        this.diseaseReports = [];
        this.filteredDiseaseReports = [];
        this.totalPages = 0;
        this.isLoading  = false;
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Filtering
  // ──────────────────────────────────────────────────────────────────────────

  applyFilters(): void {
    this.filteredDiseaseReports = this.diseaseReports.filter(report => {
      const bySeverity = this.selectedSeverity === 'all' || report.severity === this.selectedSeverity;
      const byCrop     = this.selectedCrop === 'all' || (report.crop || '').toLowerCase() === this.selectedCrop.toLowerCase();
      const byStatus   = this.selectedStatus === 'all' || report.status === this.selectedStatus;
      const byTab      = this.matchesTab(report);
      const bySearch   = !this.searchQuery || [report.disease, report.crop, report.location, report.reportedBy]
        .some(f => (f || '').toLowerCase().includes(this.searchQuery.toLowerCase()));
      return bySeverity && byCrop && byStatus && byTab && bySearch;
    });
  }

  private matchesTab(report: DiseaseReport): boolean {
    switch (this.activeStatusTab) {
      case 'active':       return report.status === 'PENDING' || report.status === 'CONFIRMED';
      case 'under_review': return report.status === 'UNDER_REVIEW';
      case 'resolved':     return report.status === 'RESOLVED' || report.status === 'TREATED';
      default:             return true;
    }
  }

  onSearchChange():       void { this.applyFilters(); }
  onCropChange():         void { this.applyFilters(); }
  onSeverityChange():     void { this.applyFilters(); }
  onStatusFilterChange(): void { this.applyFilters(); }

  switchStatusTab(tab: string): void {
    this.activeStatusTab = tab;
    this.applyFilters();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Pagination
  // ──────────────────────────────────────────────────────────────────────────

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadDiseaseReports();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadDiseaseReports();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Export
  // ──────────────────────────────────────────────────────────────────────────

  // ── Export ─────────────────────────────────────────────────────────────────

  exportReports(): void {
    this.showExportModal = true;
  }

  closeExportModal(): void {
    this.showExportModal = false;
  }

  runExport(): void {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (this.exportFormat === 'csv') {
      if (this.exportScope === 'table' || this.exportScope === 'both') {
        this.exportTableCSV(timestamp);
      }
      if (this.exportScope === 'statistics' || this.exportScope === 'both') {
        this.exportStatsCSV(timestamp);
      }
    } else {
      this.exportPDF(timestamp);
    }

    this.closeExportModal();
  }

  // ── CSV helpers ─────────────────────────────────────────────────────────────

  private exportTableCSV(timestamp: string): void {
    const headers = [
      'Report ID', 'Farmer', 'Crop', 'Disease', 'Location',
      'Affected Area', 'Severity', 'Status', 'Date', 'Treatment Notes'
    ];

    const rows = this.filteredDiseaseReports.map(r => [
      r.reportId,
      r.reportedBy || '',
      r.crop,
      r.disease,
      r.location,
      r.affectedArea,
      r.severity,
      r.status,
      this.formatDate(r.reportDate),
      (r.treatmentNotes || '').replace(/,/g, ';')
    ]);

    this.downloadCSV([headers, ...rows], `plant-health-reports-${timestamp}.csv`);
  }

  private exportStatsCSV(timestamp: string): void {
    const data: string[][] = [
      // Section 1: Summary stats
      ['PLANT HEALTH – SUMMARY STATISTICS'],
      ['Metric', 'Value', 'Change / Note'],
      ...this.healthStats.map(s => [s.title, s.value, s.change]),
      [],
      // Section 2: Disease trends table
      ['DISEASE TRENDS'],
      ['Disease', 'Crop', 'Region(s)', 'Farms Affected', 'Spread (%)', 'Monthly Change', 'Direction'],
      ...DISEASE_TRENDS.map(t => [
        t.disease, t.crop, t.region,
        String(t.farms), String(t.spreadPct),
        t.change, t.direction === 'up' ? '↑ Increasing' : '↓ Decreasing'
      ]),
    ];

    this.downloadCSV(data, `plant-health-statistics-${timestamp}.csv`);
  }

  private downloadCSV(data: string[][], filename: string): void {
    const csv = data
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── PDF helper (pure-JS, no external library) ────────────────────────────────

  private exportPDF(timestamp: string): void {
    const html = this.buildPDFHTML(timestamp);
    const win  = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow popups to export PDF.'); return; }

    win.document.write(html);
    win.document.close();

    // Let the browser render then trigger print dialog (Ctrl+P → Save as PDF)
    win.onload = () => {
      win.focus();
      win.print();
    };
  }

  private buildPDFHTML(timestamp: string): string {
    const includeTable = this.exportScope === 'table' || this.exportScope === 'both';
    const includeStats = this.exportScope === 'statistics' || this.exportScope === 'both';

    const statsRows = this.healthStats
      .map(s => `<tr><td>${s.title}</td><td><strong>${s.value}</strong></td><td>${s.change}</td></tr>`)
      .join('');

    const trendRows = DISEASE_TRENDS.map(t => `
      <tr>
        <td>${t.disease}</td>
        <td>${t.crop}</td>
        <td>${t.region}</td>
        <td><strong>${t.farms}</strong></td>
        <td>
          <div style="background:#e2e8f0;border-radius:4px;height:6px;min-width:80px">
            <div style="height:6px;border-radius:4px;width:${t.spreadPct}%;background:${
              t.severity === 'CRITICAL' ? '#e64a4a' :
              t.severity === 'HIGH'     ? '#e65100' :
              t.severity === 'MEDIUM'   ? '#f6d906' : '#059669'
            }"></div>
          </div>
        </td>
        <td><span class="badge ${t.direction === 'up' ? 'trend-up' : 'trend-down'}">${t.change}</span></td>
      </tr>`).join('');

    const reportRows = this.filteredDiseaseReports
      .map(r => `
        <tr>
          <td>${r.reportId}</td>
          <td>${r.reportedBy || '-'}</td>
          <td>${r.crop}</td>
          <td>${r.disease}</td>
          <td>${r.location}</td>
          <td>${r.affectedArea}</td>
          <td><span class="badge severity-${r.severity.toLowerCase()}">${r.severity}</span></td>
          <td><span class="badge status-${r.status.toLowerCase().replace('_','-')}">${r.status}</span></td>
          <td>${this.formatDate(r.reportDate)}</td>
        </tr>`)
      .join('') || '<tr><td colspan="9" style="text-align:center;color:#94a3b8">No reports</td></tr>';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Plant Health Report - ${timestamp}</title>
<style>
  @page { margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
  body { color: #1e293b; font-size: 12px; }

  .header { background: #328048; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .header p  { font-size: 12px; opacity: 0.85; }

  .section { margin-bottom: 28px; }
  .section-title {
    font-size: 13px; font-weight: 700; color: #328048;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px;
  }

  .stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px;
  }
  .stat-box {
    border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;
  }
  .stat-value { font-size: 22px; font-weight: 700; color: #328048; }
  .stat-label { font-size: 11px; color: #64748b; margin: 2px 0; }
  .stat-note  { font-size: 10px; color: #94a3b8; }

  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th {
    background: #f8fafc; color: #328048; padding: 8px 10px;
    text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
  }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }

  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 12px;
    font-size: 10px; font-weight: 600;
  }
  .severity-critical { background:#ffd6d6; color:#e64a4a; }
  .severity-high     { background:#fff3e0; color:#e65100; }
  .severity-medium   { background:#fff8e1; color:#a37e00; }
  .severity-low      { background:#d1fae5; color:#059669; }
  .status-pending    { background:#fff8e1; color:#a37e00; }
  .status-confirmed  { background:#e3f2fd; color:#1565c0; }
  .status-under-review { background:#fff3e0; color:#e65100; }
  .status-treated    { background:#e8eaf6; color:#3949ab; }
  .status-resolved   { background:#d1fae5; color:#059669; }
  .trend-up          { background:#ffd6d6; color:#e64a4a; }
  .trend-down        { background:#d1fae5; color:#059669; }

  .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: right; }
</style>
</head>
<body>

<div class="header">
  <h1>🌿 Plant Health Monitoring Report</h1>
  <p>Generated on ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })} &bull; Agribind Cooperative Platform</p>
</div>

${includeStats ? `
<div class="section">
  <div class="section-title">Summary Statistics</div>
  <div class="stats-grid">
    ${this.healthStats.map(s => `
      <div class="stat-box">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.title}</div>
        <div class="stat-note">${s.change}</div>
      </div>`).join('')}
  </div>
</div>

<div class="section">
  <div class="section-title">Disease Trends (${DISEASE_TRENDS.length} diseases monitored)</div>
  <table>
    <thead>
      <tr>
        <th>Disease</th>
        <th>Crop</th>
        <th>Region(s)</th>
        <th>Farms Affected</th>
        <th>Spread</th>
        <th>Monthly Change</th>
      </tr>
    </thead>
    <tbody>${trendRows}</tbody>
  </table>
</div>` : ''}

${includeTable ? `
<div class="section">
  <div class="section-title">Disease Reports Table (${this.filteredDiseaseReports.length} records)</div>
  <table>
    <thead>
      <tr>
        <th>Report ID</th><th>Farmer</th><th>Crop</th><th>Disease</th>
        <th>Location</th><th>Area (ha)</th><th>Severity</th><th>Status</th><th>Date</th>
      </tr>
    </thead>
    <tbody>${reportRows}</tbody>
  </table>
</div>` : ''}

<div class="footer">Plant Health Monitoring &bull; Agribind &bull; Exported ${timestamp}</div>
</body>
</html>`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Modals
  // ──────────────────────────────────────────────────────────────────────────

  openReportModal(): void {
    if (!this.newReport.reportedBy) { this.loadUserInfo(); }
    this.showReportModal = true;
  }
  closeReportModal(): void { this.showReportModal = false; this.resetReportForm(); }

  openViewReportModal(report: DiseaseReport): void { this.selectedReport = report; this.showViewModal = true; }
  closeViewModal():  void { this.showViewModal = false; this.selectedReport = null; }

  openTreatReportModal(report: DiseaseReport): void {
    this.selectedReport = report;
    this.treatmentForm.treatmentDate = new Date().toISOString().split('T')[0];
    this.showTreatModal = true;
  }
  closeTreatModal(): void { this.showTreatModal = false; this.selectedReport = null; this.resetTreatmentForm(); }

  openEditModal(report: DiseaseReport): void {
    this.selectedReport = report;
    this.reportForm = {
      farmerName:   report.reportedBy  || '',
      crop:         report.crop        || '',
      disease:      report.disease     || '',
      location:     report.location    || '',
      affectedArea: report.affectedArea|| '',
      severity:     report.severity    || 'MEDIUM',
      image: null
    };
    this.showEditModal = true;
  }
  closeEditModal(): void { this.showEditModal = false; this.selectedReport = null; }

  // ──────────────────────────────────────────────────────────────────────────
  // Form resets
  // ──────────────────────────────────────────────────────────────────────────

  private resetReportForm(): void {
    this.newReport = {
      farmerId: this.user.cooperativeId ? parseInt(this.user.cooperativeId) : null,
      crop: '', disease: '', location: '', affectedArea: '', severity: 'MEDIUM',
      reportDate: new Date().toISOString().split('T')[0],
      reportedBy: this.user.name, treatmentNotes: '', photos: []
    };
  }

  private resetTreatmentForm(): void {
    this.treatmentForm = {
      treatmentType: '', treatmentDate: new Date().toISOString().split('T')[0],
      treatmentNotes: '', followUpDate: '', assignedExpert: ''
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // File / Location helpers
  // ──────────────────────────────────────────────────────────────────────────

  // ── File helpers ────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;
    const incoming      = Array.from(input.files);
    const existingNames = new Set(this.newReport.photos.map(f => f.name));
    this.newReport.photos = [
      ...this.newReport.photos,
      ...incoming.filter(f => !existingNames.has(f.name))
    ];
    input.value = '';
  }

  removePhoto(index: number): void {
    this.newReport.photos = this.newReport.photos.filter((_, i) => i !== index);
  }

  // ── Camera (getUserMedia on desktop, native capture on mobile) ─────────────

  /**
   * "Take Photo" button.
   *
   * • Mobile  → clicks the hidden <input capture="environment"> which hands
   *             control directly to the native camera app.
   * • Desktop → calls getUserMedia() to show a live webcam preview modal
   *             where the user can snap a frame.
   *
   * `capture="environment"` is ignored by all desktop browsers by design;
   * that is why we need getUserMedia for the desktop path.
   */
  /** Open the file gallery / file manager picker. */
  openGallery(): void {
    const el = document.getElementById('galleryInput') as HTMLInputElement;
    if (el) el.click();
  }

  openCamera(): void {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      const el = document.getElementById('mobileCameraInput') as HTMLInputElement;
      if (el) el.click();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      // Browser has no camera API — fall back to file picker
      const el = document.getElementById('mobileCameraInput') as HTMLInputElement;
      if (el) el.click();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream: MediaStream) => {
        this.ngZone.run(() => {
          this.cameraStream    = stream;
          this.showCameraModal = true;

          // 1. Tell Angular to render the *ngIf modal into its virtual DOM
          this.cdr.detectChanges();

          // 2. setTimeout(0) yields to the browser so it can actually paint
          //    the <video> element before we try to assign srcObject
          setTimeout(() => {
            const video = document.getElementById('cameraPreviewVideo') as HTMLVideoElement;
            if (video) {
              video.srcObject = stream;
              video.play().catch(() => {});
            }
          }, 0);
        });
      })
      .catch(() => {
        const el = document.getElementById('mobileCameraInput') as HTMLInputElement;
        if (el) el.click();
      });
  }

  /** Grab the current video frame, convert to a JPEG File, add to photos. */
  snapPhoto(): void {
    const video  = document.getElementById('cameraPreviewVideo') as HTMLVideoElement;
    const canvas = document.getElementById('cameraSnapCanvas')   as HTMLCanvasElement;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    (canvas.getContext('2d') as CanvasRenderingContext2D).drawImage(video, 0, 0);

    canvas.toBlob((blob: Blob | null) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      this.newReport.photos = [...this.newReport.photos, file];
      this.closeCameraModal();
    }, 'image/jpeg', 0.92);
  }

  /** Stop the webcam stream and close the preview modal. */
  closeCameraModal(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      this.cameraStream = null;
    }
    this.showCameraModal = false;
  }

  setLocation(): void {
    if (!navigator.geolocation) { alert('Geolocation is not supported by this browser.'); return; }
    this.plantHealthService.getCurrentLocation()
      .then(loc => { this.newReport.location = `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`; })
      .catch(() => alert('Unable to get current location. Please enter it manually.'));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Submit actions
  // ──────────────────────────────────────────────────────────────────────────

  reportDisease(): void { this.openReportModal(); }

  submitDiseaseReport(): void {
    if (!this.isReportFormValidPublic()) { alert('Please fill in all required fields marked with *'); return; }
    this.plantHealthService.createQuickDiseaseReport({
      farmerId:      this.newReport.farmerId!,
      crop:          this.newReport.crop,
      disease:       this.newReport.disease,
      location:      this.newReport.location,
      affectedArea:  this.newReport.affectedArea,
      severity:      this.newReport.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      reportDate:    new Date(this.newReport.reportDate),
      reportedBy:    this.newReport.reportedBy,
      treatmentNotes:this.newReport.treatmentNotes,
      photos:        this.newReport.photos
    }).subscribe({
      next: (reports) => {
        if (reports?.length > 0) { alert('Disease report submitted successfully!'); this.loadDiseaseReports(); this.closeReportModal(); }
      },
      error: () => alert('Failed to submit disease report. Please try again.')
    });
  }

  updateDiseaseReport(): void {
    if (!this.selectedReport) return;
    if (!this.reportForm.crop || !this.reportForm.disease || !this.reportForm.location || !this.reportForm.affectedArea) {
      alert('Please fill in all required fields'); return;
    }
    this.closeEditModal();
  }

  submitTreatment(): void {
    if (!this.selectedReport) return;
    if (!this.treatmentForm.treatmentType || !this.treatmentForm.treatmentDate) {
      alert('Please fill in treatment type and date'); return;
    }
    this.plantHealthService.updateReportStatus(this.selectedReport.id!, 'UNDER_REVIEW', this.treatmentForm.treatmentNotes)
      .subscribe({
        next: () => { alert('Treatment plan submitted successfully!'); this.loadDiseaseReports(); this.closeTreatModal(); },
        error: () => alert('Failed to submit treatment plan. Please try again.')
      });
  }

  treatReport(report: DiseaseReport): void { this.openTreatReportModal(report); }

  // ──────────────────────────────────────────────────────────────────────────
  // Validation
  // ──────────────────────────────────────────────────────────────────────────

  isReportFormValidPublic(): boolean {
    return !!(this.newReport.farmerId && this.newReport.crop && this.newReport.disease &&
              this.newReport.location && this.newReport.affectedArea &&
              this.newReport.severity && this.newReport.reportedBy);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Utility
  // ──────────────────────────────────────────────────────────────────────────

  private getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH':     return 'badge-high';
      case 'MEDIUM':   return 'badge-medium';
      case 'LOW':      return 'badge-low';
      default:         return 'badge-medium';
    }
  }

  getSeverityColor(severity: string): string { return this.getSeverityClass(severity); }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'RESOLVED':     return 'status-resolved';
      case 'TREATED':      return 'status-treatment';
      case 'CONFIRMED':    return 'status-confirmed';
      case 'UNDER_REVIEW': return 'status-under-review';
      case 'PENDING':      return 'status-pending';
      default:             return 'status-pending';
    }
  }

  getStatusColor(status: string): string { return this.getStatusClass(status); }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    } catch { return 'Invalid Date'; }
  }

  isUserLoggedIn(): boolean { return !!this.user.name && this.user.name !== 'Guest User'; }
}
