import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
  ChangeDetectionStrategy, HostListener, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';

interface PriceImpactData {
  month: string;
  farmerIncome: number;
  marketStability: number;
  compliance: number;
}

interface TrainingData {
  program: string;
  adoption: number;
  yield: number;
  satisfaction: number;
}

interface ComplianceRow {
  region: string;
  average: number;
}

interface KeyMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  iconType: 'users' | 'dollar' | 'target' | 'activity';
  colorClass: string;
}

interface ReportTemplate {
  name: string;
  description: string;
  type: string;
  iconType: 'dollar' | 'target' | 'barchart' | 'trending' | 'pie';
  frequency: string;
  lastGenerated: string;
  generating: boolean;
}

interface Tooltip {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  rows: { color: string; name: string; value: string }[];
}

interface FarmerProduction {
  id: string;
  name: string;
  region: string;
  cropType: string;
  production: number;
  yieldPerHectare: number;
  qualityGrade: 'A' | 'B' | 'C';
  complianceStatus: boolean;
}

// ── Data maps per region ─────────────────────────────────────────────────────
const PRICE_DATA_BY_REGION: Record<string, PriceImpactData[]> = {
  'All Regions': [
    { month: 'Jan', farmerIncome: 85000,  marketStability: 92, compliance: 88 },
    { month: 'Feb', farmerIncome: 89000,  marketStability: 94, compliance: 91 },
    { month: 'Mar', farmerIncome: 94000,  marketStability: 89, compliance: 93 },
    { month: 'Apr', farmerIncome: 91000,  marketStability: 91, compliance: 89 },
    { month: 'May', farmerIncome: 98000,  marketStability: 96, compliance: 95 },
    { month: 'Jun', farmerIncome: 102000, marketStability: 93, compliance: 92 },
  ],
  'Centre': [
    { month: 'Jan', farmerIncome: 95000,  marketStability: 97, compliance: 95 },
    { month: 'Feb', farmerIncome: 99000,  marketStability: 98, compliance: 96 },
    { month: 'Mar', farmerIncome: 105000, marketStability: 95, compliance: 97 },
    { month: 'Apr', farmerIncome: 101000, marketStability: 96, compliance: 95 },
    { month: 'May', farmerIncome: 110000, marketStability: 99, compliance: 98 },
    { month: 'Jun', farmerIncome: 115000, marketStability: 97, compliance: 97 },
  ],
  'Littoral': [
    { month: 'Jan', farmerIncome: 88000,  marketStability: 93, compliance: 90 },
    { month: 'Feb', farmerIncome: 91000,  marketStability: 95, compliance: 92 },
    { month: 'Mar', farmerIncome: 96000,  marketStability: 91, compliance: 93 },
    { month: 'Apr', farmerIncome: 93000,  marketStability: 92, compliance: 91 },
    { month: 'May', farmerIncome: 100000, marketStability: 97, compliance: 95 },
    { month: 'Jun', farmerIncome: 104000, marketStability: 94, compliance: 93 },
  ],
  'West': [
    { month: 'Jan', farmerIncome: 78000,  marketStability: 88, compliance: 84 },
    { month: 'Feb', farmerIncome: 81000,  marketStability: 90, compliance: 87 },
    { month: 'Mar', farmerIncome: 86000,  marketStability: 85, compliance: 88 },
    { month: 'Apr', farmerIncome: 83000,  marketStability: 87, compliance: 85 },
    { month: 'May', farmerIncome: 90000,  marketStability: 92, compliance: 90 },
    { month: 'Jun', farmerIncome: 94000,  marketStability: 89, compliance: 88 },
  ],
  'South-West': [
    { month: 'Jan', farmerIncome: 70000,  marketStability: 80, compliance: 74 },
    { month: 'Feb', farmerIncome: 73000,  marketStability: 82, compliance: 77 },
    { month: 'Mar', farmerIncome: 77000,  marketStability: 78, compliance: 79 },
    { month: 'Apr', farmerIncome: 74000,  marketStability: 79, compliance: 75 },
    { month: 'May', farmerIncome: 80000,  marketStability: 84, compliance: 80 },
    { month: 'Jun', farmerIncome: 84000,  marketStability: 81, compliance: 78 },
  ],
  'North-West': [
    { month: 'Jan', farmerIncome: 72000,  marketStability: 82, compliance: 76 },
    { month: 'Feb', farmerIncome: 75000,  marketStability: 84, compliance: 78 },
    { month: 'Mar', farmerIncome: 79000,  marketStability: 80, compliance: 80 },
    { month: 'Apr', farmerIncome: 76000,  marketStability: 81, compliance: 77 },
    { month: 'May', farmerIncome: 82000,  marketStability: 86, compliance: 82 },
    { month: 'Jun', farmerIncome: 86000,  marketStability: 83, compliance: 80 },
  ],
};

const METRICS_BY_REGION: Record<string, KeyMetric[]> = {
  'All Regions': [
    { title: 'Total Farmers Impacted',  value: '127,543', change: '+8.5%', trend: 'up',   iconType: 'users',    colorClass: 'metric-blue'   },
    { title: 'Average Income Increase', value: '23.7%',   change: '+2.1%', trend: 'up',   iconType: 'dollar',   colorClass: 'metric-green'  },
    { title: 'Training Effectiveness',  value: '4.5/5',   change: '+0.3',  trend: 'up',   iconType: 'target',   colorClass: 'metric-amber'  },
    { title: 'Compliance Rate',         value: '92.3%',   change: '-1.2%', trend: 'down', iconType: 'activity', colorClass: 'metric-indigo' },
  ],
  'Centre': [
    { title: 'Total Farmers Impacted',  value: '34,210',  change: '+10.2%', trend: 'up', iconType: 'users',    colorClass: 'metric-blue'   },
    { title: 'Average Income Increase', value: '28.4%',   change: '+3.1%',  trend: 'up', iconType: 'dollar',   colorClass: 'metric-green'  },
    { title: 'Training Effectiveness',  value: '4.8/5',   change: '+0.5',   trend: 'up', iconType: 'target',   colorClass: 'metric-amber'  },
    { title: 'Compliance Rate',         value: '96.5%',   change: '+1.2%',  trend: 'up', iconType: 'activity', colorClass: 'metric-indigo' },
  ],
  'Littoral': [
    { title: 'Total Farmers Impacted',  value: '28,970',  change: '+7.8%',  trend: 'up',   iconType: 'users',    colorClass: 'metric-blue'   },
    { title: 'Average Income Increase', value: '25.1%',   change: '+2.4%',  trend: 'up',   iconType: 'dollar',   colorClass: 'metric-green'  },
    { title: 'Training Effectiveness',  value: '4.6/5',   change: '+0.4',   trend: 'up',   iconType: 'target',   colorClass: 'metric-amber'  },
    { title: 'Compliance Rate',         value: '93.8%',   change: '-0.5%',  trend: 'down', iconType: 'activity', colorClass: 'metric-indigo' },
  ],
  'West': [
    { title: 'Total Farmers Impacted',  value: '22,340',  change: '+6.2%',  trend: 'up',   iconType: 'users',    colorClass: 'metric-blue'   },
    { title: 'Average Income Increase', value: '21.3%',   change: '+1.8%',  trend: 'up',   iconType: 'dollar',   colorClass: 'metric-green'  },
    { title: 'Training Effectiveness',  value: '4.4/5',   change: '+0.2',   trend: 'up',   iconType: 'target',   colorClass: 'metric-amber'  },
    { title: 'Compliance Rate',         value: '88.7%',   change: '-2.1%',  trend: 'down', iconType: 'activity', colorClass: 'metric-indigo' },
  ],
  'South-West': [
    { title: 'Total Farmers Impacted',  value: '19,820',  change: '+4.1%',  trend: 'up',   iconType: 'users',    colorClass: 'metric-blue'   },
    { title: 'Average Income Increase', value: '18.9%',   change: '+1.2%',  trend: 'up',   iconType: 'dollar',   colorClass: 'metric-green'  },
    { title: 'Training Effectiveness',  value: '4.1/5',   change: '+0.1',   trend: 'up',   iconType: 'target',   colorClass: 'metric-amber'  },
    { title: 'Compliance Rate',         value: '76.4%',   change: '-3.5%',  trend: 'down', iconType: 'activity', colorClass: 'metric-indigo' },
  ],
  'North-West': [
    { title: 'Total Farmers Impacted',  value: '18,450',  change: '+5.0%',  trend: 'up',   iconType: 'users',    colorClass: 'metric-blue'   },
    { title: 'Average Income Increase', value: '19.6%',   change: '+1.5%',  trend: 'up',   iconType: 'dollar',   colorClass: 'metric-green'  },
    { title: 'Training Effectiveness',  value: '4.2/5',   change: '+0.2',   trend: 'up',   iconType: 'target',   colorClass: 'metric-amber'  },
    { title: 'Compliance Rate',         value: '79.8%',   change: '-2.8%',  trend: 'down', iconType: 'activity', colorClass: 'metric-indigo' },
  ],
};

@Component({
  selector: 'app-reports-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-analytics.component.html',
  styleUrls: ['./report-analytics.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ReportsAnalyticsComponent implements OnInit, OnDestroy {

  // ── API base URL ──────────────────────────────────────────────────────────
  private readonly API_URL = environment.apiUrl; // 'http://localhost:8080/api/v1';

  // ── Filters ───────────────────────────────────────────────────────────────
  reportType     = 'Comprehensive Report';
  selectedRegion = 'All Regions';

  reportTypes = [
    'Comprehensive Report', 'Price Impact Analysis',
    'Training Effectiveness', 'Compliance Summary', 'Production Report'
  ];
  regions = ['All Regions', 'Centre', 'Littoral', 'West', 'South-West', 'North-West'];

  // ── Date range picker ─────────────────────────────────────────────────────
  showCalendar    = false;
  calendarMode: 'start' | 'end' = 'start';
  startDate: Date = new Date(2024, 0, 1);   // Jan 01 2024
  endDate: Date   = new Date(2026, 2, 27);  // Mar 27 2026
  calendarYear    = new Date().getFullYear();
  calendarMonth   = new Date().getMonth();
  calendarDays: (Date | null)[] = [];
  weekDays        = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  months          = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  get dateLabel(): string {
    return `${this.formatDate(this.startDate)} – ${this.formatDate(this.endDate)}`;
  }

  // ── Export dropdown ───────────────────────────────────────────────────────
  showExportMenu  = false;
  exporting       = false;
  exportFormat: 'pdf' | 'excel' | null = null;

  // ── Farmers Production Report ─────────────────────────────────────────────
  generatingFarmersReport = false;
  farmersProductionData: FarmerProduction[] = [];

  // ── Animation ─────────────────────────────────────────────────────────────
  animatedIn   = false;
  lineProgress = 0;
  barProgress  = 0;
  private rafId: number | null = null;
  private startTime: number | null = null;
  private readonly DURATION = 1100;

  // ── Active data (driven by filters) ──────────────────────────────────────
  priceImpactData: PriceImpactData[] = [];
  keyMetrics: KeyMetric[] = [];

  readonly trainingData: TrainingData[] = [
    { program: 'Pest Control',    adoption: 85, yield: 22, satisfaction: 4.6 },
    { program: 'Financial Mgmt', adoption: 78, yield: 15, satisfaction: 4.3 },
    { program: 'New Techniques',  adoption: 92, yield: 28, satisfaction: 4.8 },
    { program: 'Weather Adapt',   adoption: 74, yield: 18, satisfaction: 4.2 },
    { program: 'Disease Prev',    adoption: 88, yield: 25, satisfaction: 4.7 },
  ];

  readonly complianceRegions: ComplianceRow[] = [
    { region: 'Centre',     average: 95.0 },
    { region: 'Littoral',   average: 91.8 },
    { region: 'West',       average: 88.2 },
    { region: 'North-West', average: 82.7 },
  ];

  reportTemplates: ReportTemplate[] = [
    { name: 'Monthly Price Impact Report',     description: 'Complete analysis of price control effectiveness', type: 'price-impact',       iconType: 'dollar',   frequency: 'Monthly',   lastGenerated: '2 days ago',  generating: false },
    { name: 'Training Effectiveness Analysis', description: 'Training program impact and farmer feedback',      type: 'training-analysis',  iconType: 'target',   frequency: 'Quarterly', lastGenerated: '1 week ago',  generating: false },
    { name: 'Regional Compliance Summary',     description: 'Price compliance by region and department',       type: 'compliance-summary', iconType: 'barchart', frequency: 'Weekly',    lastGenerated: 'Yesterday',   generating: false },
    { name: 'Production & Yield Report',       description: 'Agricultural output and efficiency metrics',      type: 'production-report',  iconType: 'trending', frequency: 'Monthly',   lastGenerated: '3 days ago',  generating: false },
    { name: 'Comprehensive Dashboard',         description: 'All metrics and KPIs in one report',              type: 'comprehensive',      iconType: 'pie',      frequency: 'Monthly',   lastGenerated: '1 day ago',   generating: false },
  ];

  // ── Chart dimensions ──────────────────────────────────────────────────────
  readonly aW = 620; readonly aH = 280;
  readonly aPL = 60; readonly aPB = 36; readonly aPT = 14;

  readonly bW = 480; readonly bH = 280;
  readonly bPL = 100; readonly bPB = 20; readonly bPT = 14;

  readonly cW = 480; readonly cH = 280;
  readonly cPL = 44; readonly cPB = 36; readonly cPT = 14;

  // ── Tooltips ──────────────────────────────────────────────────────────────
  areaTooltip:       Tooltip = { visible: false, x: 0, y: 0, label: '', rows: [] };
  trainingTooltip:   Tooltip = { visible: false, x: 0, y: 0, label: '', rows: [] };
  complianceTooltip: Tooltip = { visible: false, x: 0, y: 0, label: '', rows: [] };

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.applyFilters();
    this.buildCalendar();
    this.fetchFarmersProductionData();
    setTimeout(() => { this.animatedIn = true; this.startAnim(); }, 60);
  }

  ngOnDestroy(): void { if (this.rafId) cancelAnimationFrame(this.rafId); }

  // ── Close dropdowns when clicking outside ─────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!this.el.nativeElement.contains(target)) {
      this.showCalendar  = false;
      this.showExportMenu = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FILTERS
  // ─────────────────────────────────────────────────────────────────────────
  applyFilters(): void {
    const regionKey = this.selectedRegion in PRICE_DATA_BY_REGION
      ? this.selectedRegion : 'All Regions';

    this.priceImpactData = PRICE_DATA_BY_REGION[regionKey];
    this.keyMetrics      = METRICS_BY_REGION[regionKey] ?? METRICS_BY_REGION['All Regions'];
    this.fetchFarmersProductionData();
  }

  onFilterChange(): void {
    this.applyFilters();
    this.startAnim();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FARMERS PRODUCTION DATA
  // ─────────────────────────────────────────────────────────────────────────
  private fetchFarmersProductionData(): void {
    // Sample data - in production, this would be an API call
    const allFarmers: FarmerProduction[] = [
      { id: 'F001', name: 'John Doe', region: 'Centre', cropType: 'Maize', production: 2500, yieldPerHectare: 3200, qualityGrade: 'A', complianceStatus: true },
      { id: 'F002', name: 'Jane Smith', region: 'Centre', cropType: 'Cassava', production: 1800, yieldPerHectare: 2800, qualityGrade: 'B', complianceStatus: true },
      { id: 'F003', name: 'Paul Biya', region: 'Littoral', cropType: 'Cocoa', production: 950, yieldPerHectare: 2100, qualityGrade: 'A', complianceStatus: true },
      { id: 'F004', name: 'Marie Claire', region: 'West', cropType: 'Coffee', production: 1200, yieldPerHectare: 2400, qualityGrade: 'B', complianceStatus: false },
      { id: 'F005', name: 'James Brown', region: 'South-West', cropType: 'Palm Oil', production: 3200, yieldPerHectare: 3500, qualityGrade: 'C', complianceStatus: false },
      { id: 'F006', name: 'Sarah Johnson', region: 'North-West', cropType: 'Maize', production: 2100, yieldPerHectare: 2900, qualityGrade: 'B', complianceStatus: true },
      { id: 'F007', name: 'Michael Ndi', region: 'Centre', cropType: 'Cassava', production: 1950, yieldPerHectare: 2750, qualityGrade: 'A', complianceStatus: true },
      { id: 'F008', name: 'Esther Kwang', region: 'Littoral', cropType: 'Cocoa', production: 1100, yieldPerHectare: 2350, qualityGrade: 'B', complianceStatus: false },
      { id: 'F009', name: 'David Foning', region: 'West', cropType: 'Maize', production: 2300, yieldPerHectare: 3100, qualityGrade: 'A', complianceStatus: true },
      { id: 'F010', name: 'Grace Tchami', region: 'South-West', cropType: 'Cassava', production: 1650, yieldPerHectare: 2600, qualityGrade: 'B', complianceStatus: false },
      { id: 'F011', name: 'Peter Atem', region: 'North-West', cropType: 'Coffee', production: 980, yieldPerHectare: 2250, qualityGrade: 'C', complianceStatus: true },
      { id: 'F012', name: 'Lucy Ndam', region: 'Centre', cropType: 'Cocoa', production: 1250, yieldPerHectare: 2450, qualityGrade: 'B', complianceStatus: true },
    ];

    // Filter by selected region
    if (this.selectedRegion !== 'All Regions') {
      this.farmersProductionData = allFarmers.filter(f => f.region === this.selectedRegion);
    } else {
      this.farmersProductionData = allFarmers;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GENERATE FARMERS PRODUCTION REPORT
  // ─────────────────────────────────────────────────────────────────────────
  generateFarmersReport(format: 'pdf' | 'excel'): void {
    this.generatingFarmersReport = true;
    
    const params = new HttpParams()
      .set('region', this.selectedRegion)
      .set('startDate', this.startDate.toISOString().split('T')[0])
      .set('endDate', this.endDate.toISOString().split('T')[0])
      .set('format', format)
      .set('reportType', 'farmers-production');
    
    const endpoint = `${this.API_URL}/reports/jasper/farmers-production`;
    const mimeType = format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    
    this.http.get(endpoint, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({ Accept: mimeType })
    }).subscribe({
      next: (blob) => {
        const filename = `farmers-production-${this.selectedRegion}-${this.formatDate(this.startDate)}-${this.formatDate(this.endDate)}.${ext}`;
        this.triggerDownload(blob, filename);
        this.generatingFarmersReport = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Farmers report generation failed:', err);
        alert('Failed to generate farmers production report. Please check the backend.');
        this.generatingFarmersReport = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORT STATISTICS
  // ─────────────────────────────────────────────────────────────────────────
  getTotalProduction(): number {
    return this.farmersProductionData.reduce((sum, farmer) => sum + farmer.production, 0);
  }

  getAverageYield(): number {
    if (this.farmersProductionData.length === 0) return 0;
    const totalYield = this.farmersProductionData.reduce((sum, farmer) => sum + farmer.yieldPerHectare, 0);
    return Math.round(totalYield / this.farmersProductionData.length);
  }

  getComplianceRate(): number {
  if (this.farmersProductionData.length === 0) return 0;
  const compliantCount = this.farmersProductionData.filter(f => f.complianceStatus).length;
  return Math.round((compliantCount / this.farmersProductionData.length) * 100);
}

  // ─────────────────────────────────────────────────────────────────────────
  // CALENDAR
  // ─────────────────────────────────────────────────────────────────────────
  toggleCalendar(e: MouseEvent): void {
    e.stopPropagation();
    this.showCalendar   = !this.showCalendar;
    this.showExportMenu = false;
    if (this.showCalendar) {
      this.calendarMode  = 'start';
      this.calendarYear  = this.startDate.getFullYear();
      this.calendarMonth = this.startDate.getMonth();
      this.buildCalendar();
    }
  }

  buildCalendar(): void {
    const first = new Date(this.calendarYear, this.calendarMonth, 1);
    const last  = new Date(this.calendarYear, this.calendarMonth + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(this.calendarYear, this.calendarMonth, d));
    this.calendarDays = days;
  }

  prevMonth(): void {
    if (this.calendarMonth === 0) { this.calendarMonth = 11; this.calendarYear--; }
    else this.calendarMonth--;
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.calendarMonth === 11) { this.calendarMonth = 0; this.calendarYear++; }
    else this.calendarMonth++;
    this.buildCalendar();
  }

  selectDay(day: Date | null): void {
    if (!day) return;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (day > today) return;
    if (this.calendarMode === 'start') {
      this.startDate    = day;
      this.calendarMode = 'end';
    } else {
      if (day < this.startDate) {
        this.endDate   = this.startDate;
        this.startDate = day;
      } else {
        this.endDate = day;
      }
      this.showCalendar = false;
      this.onFilterChange();
    }
  }

  isDayStart(day: Date | null): boolean {
    return !!day && this.sameDay(day, this.startDate);
  }

  isDayEnd(day: Date | null): boolean {
    return !!day && this.sameDay(day, this.endDate);
  }

  isDayInRange(day: Date | null): boolean {
    return !!day && day > this.startDate && day < this.endDate;
  }

  isDayToday(day: Date | null): boolean {
    return !!day && this.sameDay(day, new Date());
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  public formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  get calendarTitle(): string {
    return `${this.months[this.calendarMonth]} ${this.calendarYear}`;
  }

  get calendarModeLabel(): string {
    return this.calendarMode === 'start' ? 'Select start date' : 'Select end date';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORT REPORT (calls Spring Boot)
  // ─────────────────────────────────────────────────────────────────────────
  toggleExportMenu(e: MouseEvent): void {
    e.stopPropagation();
    this.showExportMenu = !this.showExportMenu;
    this.showCalendar   = false;
  }

  exportReport(format: 'pdf' | 'excel'): void {
    this.showExportMenu = false;
    this.exporting      = true;
    this.exportFormat   = format;

    const params = new HttpParams()
      .set('region',     this.selectedRegion)
      .set('reportType', this.reportType)
      .set('startDate',  this.startDate.toISOString().split('T')[0])
      .set('endDate',    this.endDate.toISOString().split('T')[0])
      .set('format',     format);

    const endpoint = `${this.API_URL}/reports/export`;
    const mimeType = format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';

    this.http.get(endpoint, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({ Accept: mimeType })
    }).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `agribind-report-${this.selectedRegion}-${this.reportType}.${ext}`);
        this.exporting = false;
        this.exportFormat = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Export failed:', err);
        alert('Report export failed. Please check that the backend is running.');
        this.exporting = false;
        this.exportFormat = null;
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEMPLATE GENERATE & DOWNLOAD (calls JasperReport via Spring Boot)
  // ─────────────────────────────────────────────────────────────────────────
  generateReport(tpl: ReportTemplate, format: 'pdf' | 'excel'): void {
    tpl.generating = true;

    const params = new HttpParams()
      .set('region',    this.selectedRegion)
      .set('startDate', this.startDate.toISOString().split('T')[0])
      .set('endDate',   this.endDate.toISOString().split('T')[0])
      .set('format',    format);

    const endpoint = `${this.API_URL}/reports/jasper/${tpl.type}`;
    const mimeType = format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';

    this.http.get(endpoint, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({ Accept: mimeType })
    }).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `${tpl.type}-${this.selectedRegion}.${ext}`);
        tpl.generating    = false;
        tpl.lastGenerated = 'Just now';
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('JasperReport generation failed:', err);
        alert(`Report generation failed for "${tpl.name}". Please check the backend.`);
        tpl.generating = false;
        this.cdr.markForCheck();
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMATION
  // ─────────────────────────────────────────────────────────────────────────
  private ease(t: number): number { return t < .5 ? 2*t*t : -1+(4-2*t)*t; }

  private startAnim(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lineProgress = 0; this.barProgress = 0; this.startTime = null;
    const tick = (ts: number) => {
      if (!this.startTime) this.startTime = ts;
      const raw = Math.min((ts - this.startTime) / this.DURATION, 1);
      const t   = this.ease(raw);
      this.lineProgress = t; this.barProgress = t;
      this.cdr.markForCheck();
      if (raw < 1) this.rafId = requestAnimationFrame(tick);
      else { this.lineProgress = 1; this.barProgress = 1; this.cdr.markForCheck(); }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AREA CHART helpers
  // ─────────────────────────────────────────────────────────────────────────
  private aUsableW(): number { return this.aW - this.aPL - 20; }
  private aUsableH(): number { return this.aH - this.aPB - this.aPT; }
  private aX(i: number): number { return this.aPL + i * (this.aUsableW() / (this.priceImpactData.length - 1 || 1)); }
  private aYIncome(v: number): number { return this.aPT + this.aUsableH() - (v / 120000) * this.aUsableH(); }
  private aYPct(v: number): number    { return this.aPT + this.aUsableH() - (v / 110)    * this.aUsableH(); }

  getAreaFill(): string {
    if (!this.priceImpactData.length) return '';
    const pts = this.priceImpactData.map((d, i) => `${this.aX(i)},${this.aYIncome(d.farmerIncome)}`);
    const baseY = this.aPT + this.aUsableH();
    return `${this.aX(0)},${baseY} ${pts.join(' ')} ${this.aX(this.priceImpactData.length-1)},${baseY}`;
  }

  getAreaLine(key: 'farmerIncome' | 'marketStability' | 'compliance'): string {
    return this.priceImpactData.map((d, i) => {
      const y = key === 'farmerIncome' ? this.aYIncome(d[key]) : this.aYPct(d[key] as number);
      return `${this.aX(i)},${y}`;
    }).join(' ');
  }

  getAreaPathLength(key: 'farmerIncome' | 'marketStability' | 'compliance'): number {
    let len = 0;
    for (let i = 1; i < this.priceImpactData.length; i++) {
      const d0 = this.priceImpactData[i-1], d1 = this.priceImpactData[i];
      const y0 = key === 'farmerIncome' ? this.aYIncome(d0[key]) : this.aYPct(d0[key] as number);
      const y1 = key === 'farmerIncome' ? this.aYIncome(d1[key]) : this.aYPct(d1[key] as number);
      const dx = this.aX(i) - this.aX(i-1);
      len += Math.sqrt(dx*dx + (y1-y0)*(y1-y0));
    }
    return len || 500;
  }

  getAreaDashOffset(key: 'farmerIncome' | 'marketStability' | 'compliance'): number {
    return this.getAreaPathLength(key) * (1 - this.lineProgress);
  }

  getAreaDots(key: 'farmerIncome' | 'marketStability' | 'compliance'): { x: number; y: number }[] {
    return this.priceImpactData.map((d, i) => ({
      x: this.aX(i),
      y: key === 'farmerIncome' ? this.aYIncome(d[key]) : this.aYPct(d[key] as number)
    }));
  }

  getAreaYLabels(): { val: string; y: number }[] {
    return [110000, 80000, 60000, 40000, 20000, 0].map(v => ({
      val: v === 0 ? '0' : (v/1000) + 'k',
      y: this.aYIncome(v) + 4
    }));
  }

  getAreaYLabelsRight(): { val: string; y: number }[] {
    return [100, 75, 50, 25, 0].map(v => ({ val: String(v), y: this.aYPct(v) + 4 }));
  }

  showAreaTooltip(i: number, event: MouseEvent): void {
    const d = this.priceImpactData[i];
    const wrap = (event.target as SVGElement).closest('.chart-wrap')!.getBoundingClientRect();
    this.areaTooltip = {
      visible: true,
      x: event.clientX - wrap.left + 12,
      y: event.clientY - wrap.top - 10,
      label: d.month,
      rows: [
        { color: '#22C55E', name: 'Farmer Income',    value: d.farmerIncome.toLocaleString() + ' XAF' },
        { color: '#3B82F6', name: 'Market Stability', value: d.marketStability + '%' },
        { color: '#F59E0B', name: 'Compliance',       value: d.compliance + '%' },
      ]
    };
  }

  hideAreaTooltip(): void { this.areaTooltip.visible = false; }

  // ─────────────────────────────────────────────────────────────────────────
  // TRAINING BAR CHART helpers
  // ─────────────────────────────────────────────────────────────────────────
  private bUsableW(): number { return this.bW - this.bPL - 20; }
  public  bRowH(): number    { return (this.bH - this.bPB - this.bPT) / this.trainingData.length; }

  getBarAdoptionW(v: number): number { return (v / 100) * this.bUsableW() * this.barProgress; }
  getBarYieldW(v: number): number    { return (v / 100) * this.bUsableW() * this.barProgress; }

  getBarY(i: number, sub: number): number { return this.bPT + i * this.bRowH() + sub; }
  getBarRowH(): number                    { return this.bRowH() * 0.32; }
  getBarLabelY(i: number): number         { return this.getBarY(i, this.bRowH() * 0.5) + 4; }

  getBXLabels(): { val: string; x: number }[] {
    return [0, 25, 50, 75, 100].map(v => ({
      val: String(v),
      x: this.bPL + (v / 100) * this.bUsableW()
    }));
  }

  showTrainingTooltip(i: number, event: MouseEvent): void {
    const d = this.trainingData[i];
    const wrap = (event.target as SVGElement).closest('.chart-wrap')!.getBoundingClientRect();
    this.trainingTooltip = {
      visible: true,
      x: event.clientX - wrap.left + 12,
      y: event.clientY - wrap.top - 10,
      label: d.program,
      rows: [
        { color: '#22C55E', name: 'Adoption Rate',     value: d.adoption + '%' },
        { color: '#3B82F6', name: 'Yield Improvement', value: d.yield + '%' },
        { color: '#F59E0B', name: 'Satisfaction',      value: d.satisfaction + '/5' },
      ]
    };
  }

  hideTrainingTooltip(): void { this.trainingTooltip.visible = false; }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPLIANCE LINE CHART helpers
  // ─────────────────────────────────────────────────────────────────────────
  private cUsableW(): number { return this.cW - this.cPL - 20; }
  private cUsableH(): number { return this.cH - this.cPB - this.cPT; }
  private cX(i: number): number { return this.cPL + i * (this.cUsableW() / (this.complianceRegions.length - 1)); }
  private cY(v: number): number { return this.cPT + this.cUsableH() - (v / 110) * this.cUsableH(); }

  getComplianceLine(): string {
    return this.complianceRegions.map((d, i) => `${this.cX(i)},${this.cY(d.average)}`).join(' ');
  }

  getCompliancePathLen(): number {
    let len = 0;
    for (let i = 1; i < this.complianceRegions.length; i++) {
      const dx = this.cX(i) - this.cX(i-1);
      const dy = this.cY(this.complianceRegions[i].average) - this.cY(this.complianceRegions[i-1].average);
      len += Math.sqrt(dx*dx + dy*dy);
    }
    return len || 400;
  }

  getComplianceDashOffset(): number { return this.getCompliancePathLen() * (1 - this.lineProgress); }

  getComplianceDots(): { x: number; y: number }[] {
    return this.complianceRegions.map((d, i) => ({ x: this.cX(i), y: this.cY(d.average) }));
  }

  getCYLabels(): { val: string; y: number }[] {
    return [100, 75, 50, 25, 0].map(v => ({ val: String(v), y: this.cY(v) + 4 }));
  }

  showComplianceTooltip(i: number, event: MouseEvent): void {
    const d = this.complianceRegions[i];
    const wrap = (event.target as SVGElement).closest('.chart-wrap')!.getBoundingClientRect();
    this.complianceTooltip = {
      visible: true,
      x: event.clientX - wrap.left + 12,
      y: event.clientY - wrap.top - 10,
      label: d.region,
      rows: [{ color: '#3B82F6', name: 'Avg Compliance', value: d.average + '%' }]
    };
  }

  hideComplianceTooltip(): void { this.complianceTooltip.visible = false; }

  // ─────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────
  xLabelPositions(): number[]  { return this.priceImpactData.map((_, i) => this.aX(i)); }
  cXLabelPositions(): number[] { return this.complianceRegions.map((_, i) => this.cX(i)); }
}