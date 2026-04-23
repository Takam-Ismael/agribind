import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ProductionData {
  month: string;
  cocoa: number;
  coffee: number;
  palmOil: number;
  cotton: number;
  cassava: number;
  maize: number;
}

interface RegionPerformance {
  name: string;
  production: number;
  efficiency: number;
  compliance: number;
  status: 'excellent' | 'good' | 'fair' | 'needs-attention';
}

interface CropDistribution {
  name: string;
  value: number;
  color: string;
}

interface WeatherMetric {
  title: string;
  value: string;
  status: 'optimal' | 'good' | 'fair' | 'poor';
  icon: string;
  description: string;
}

interface Alert {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
}

interface CropsByRegion {
  name: string;
  cocoa: number;
  coffee: number;
  palmOil: number;
  cotton: number;
  cassava: number;
  maize: number;
  total: number;
}

interface CropsByFarmers {
  cropName: string;
  color: string;
  totalFarmers: number;
  regions: {
    name: string;
    count: number;
  }[];
}

@Component({
  selector: 'app-production-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './production-monitoring.component.html',
  styleUrls: ['./production-monitoring.component.scss']
})
export class ProductionMonitoringComponent implements OnInit, OnDestroy {

  // ── Filters ──
  selectedRegion = 'All Regions';
  selectedCrop   = 'All Crops';

  regions = ['All Regions', 'Centre', 'Littoral', 'West', 'South-West', 'North-West', 'South'];
  crops   = ['All Crops', 'Cocoa', 'Coffee', 'Palm Oil', 'Cotton', 'Cassava', 'Maize'];

  // ── Animation state ──
  animatedIn   = false;
  lineProgress = 0;
  cropsBarProgress = 0;
  farmersBarProgress = 0;
  pieProgress = 0;

  private animFrameId: number | null = null;
  private startTime: number | null = null;
  private readonly ANIM_DURATION = 1200;

  // ── Raw data ──
  private readonly allProductionData: ProductionData[] = [
    { month: 'Jan', cocoa: 45000, coffee: 28000, palmOil: 35000, cotton: 12000, cassava: 18000, maize: 14000 },
    { month: 'Feb', cocoa: 48000, coffee: 30000, palmOil: 38000, cotton: 15000, cassava: 19500, maize: 15200 },
    { month: 'Mar', cocoa: 52000, coffee: 32000, palmOil: 42000, cotton: 18000, cassava: 21000, maize: 16800 },
    { month: 'Apr', cocoa: 49000, coffee: 29000, palmOil: 40000, cotton: 16000, cassava: 19800, maize: 15500 },
    { month: 'May', cocoa: 55000, coffee: 35000, palmOil: 45000, cotton: 20000, cassava: 23500, maize: 18500 },
    { month: 'Jun', cocoa: 58000, coffee: 38000, palmOil: 48000, cotton: 22000, cassava: 24800, maize: 19600 }
  ];

  private readonly allRegionPerformance: RegionPerformance[] = [
    { name: 'Centre',     production: 95, efficiency: 92, compliance: 89, status: 'excellent' },
    { name: 'Littoral',   production: 88, efficiency: 85, compliance: 91, status: 'good' },
    { name: 'West',       production: 82, efficiency: 88, compliance: 86, status: 'good' },
    { name: 'South-West', production: 75, efficiency: 78, compliance: 72, status: 'needs-attention' },
    { name: 'North-West', production: 79, efficiency: 82, compliance: 76, status: 'fair' },
    { name: 'South',      production: 91, efficiency: 89, compliance: 87, status: 'good' }
  ];

  private readonly allCropDistribution: CropDistribution[] = [
    { name: 'Cocoa',    value: 30, color: '#8B4513' },
    { name: 'Coffee',   value: 20, color: '#6B4423' },
    { name: 'Palm Oil', value: 15, color: '#228B22' },
    { name: 'Cotton',   value: 10, color: '#E09000' },
    { name: 'Cassava',  value: 15, color: '#B8860B' },
    { name: 'Maize',    value: 10, color: '#DAA520' }
  ];

  // ── Derived / filtered ──
  productionData: ProductionData[] = [];
  regionPerformance: RegionPerformance[] = [];
  cropDistribution: CropDistribution[] = [];

  weatherMetrics: WeatherMetric[] = [
    { title: 'Temperature', value: '26°C',   status: 'optimal', icon: 'thermometer', description: 'Optimal for cocoa growth' },
    { title: 'Rainfall',    value: '145mm',  status: 'good',    icon: 'droplets',    description: 'Above average this month' },
    { title: 'Humidity',    value: '78%',    status: 'optimal', icon: 'sun',         description: 'Ideal growing conditions' },
    { title: 'Soil Quality',value: '4.2/5',  status: 'good',    icon: 'leaf',        description: 'Fertility index improving' }
  ];

  alerts: Alert[] = [
    { type: 'warning', title: 'Pest Alert – South-West Region',  description: 'Cocoa pod borer detected in 3 farms. Immediate intervention required.', time: '2 hours ago', severity: 'high' },
    { type: 'info',    title: 'Weather Update – North Region',   description: 'Heavy rainfall expected this week. Harvest preparations recommended.',   time: '4 hours ago', severity: 'medium' },
    { type: 'success', title: 'Training Impact – Centre Region', description: 'Significant yield improvement reported after recent training programs.',   time: '1 day ago',   severity: 'low' }
  ];

  // ── Chart dimensions ──
  readonly chartWidth         = 560;
  readonly chartHeight        = 240;
  readonly chartPaddingLeft   = 50;
  readonly chartPaddingBottom = 30;
  readonly chartPaddingTop    = 10;

  // ── Tooltip state (updated with cassava & maize) ──
  lineTooltip: { 
    visible: boolean; x: number; y: number; month: string; 
    cocoa: number; coffee: number; palmOil: number; cotton: number;
    cassava: number; maize: number 
  } = {
    visible: false, x: 0, y: 0, month: '',
    cocoa: 0, coffee: 0, palmOil: 0, cotton: 0,
    cassava: 0, maize: 0
  };

  pieTooltip: { visible: boolean; x: number; y: number; name: string; value: number } =
    { visible: false, x: 0, y: 0, name: '', value: 0 };

  // ── Crops by Region ──
  cropsByRegionView: 'chart' | 'table' = 'chart';
  cropsByRegionData: CropsByRegion[] = [];

  readonly cropsChartWidth = 560;
  readonly cropsChartHeight = 240;
  readonly cropsChartPaddingLeft = 40;
  readonly cropsChartPaddingBottom = 30;
  readonly cropsChartPaddingTop = 10;

  get barGroupWidth(): number {
    const usableW = this.cropsChartWidth - this.cropsChartPaddingLeft - 20;
    return usableW / Math.max(this.cropsByRegionData.length, 1);
  }

  get barWidth(): number {
    return (this.barGroupWidth - 20) / 6; // now 6 crops
  }

  get barPadding(): number {
    return 6;
  }

  cropsBarTooltip: { visible: boolean; x: number; y: number; region: string; cropName: string; value: number } = 
    { visible: false, x: 0, y: 0, region: '', cropName: '', value: 0 };

  // ── Crops by Farmers ──
  cropsByFarmersView: 'chart' | 'table' = 'chart';
  cropsByFarmersData: CropsByFarmers[] = [];

  readonly farmersChartWidth = 560;
  readonly farmersChartHeight = 240;
  readonly farmersChartPaddingLeft = 40;
  readonly farmersChartPaddingBottom = 30;
  readonly farmersChartPaddingTop = 10;

  get farmersBarGroupWidth(): number {
    const usableW = this.farmersChartWidth - this.farmersChartPaddingLeft - 20;
    return usableW / Math.max(this.cropsByFarmersData.length, 1);
  }

  get farmersBarWidth(): number {
    return this.farmersBarGroupWidth - 20;
  }

  get farmersBarPadding(): number {
    return 10;
  }

  farmersBarTooltip: { 
    visible: boolean; 
    x: number; 
    y: number; 
    cropName: string; 
    totalFarmers: number;
    regions: { name: string; count: number }[];
  } = { 
    visible: false, 
    x: 0, 
    y: 0, 
    cropName: '', 
    totalFarmers: 0,
    regions: []
  };

  get farmersLegend(): { name: string; color: string }[] {
    return this.cropsByFarmersData.map(crop => ({
      name: crop.cropName,
      color: crop.color
    }));
  }

  get farmerRegions(): string[] {
    return ['Centre', 'Littoral', 'West', 'South-West', 'North-West', 'South'];
  }

  lineLengths: Record<string, number> = { cocoa: 600, coffee: 600, palmOil: 600, cotton: 600, cassava: 600, maize: 600 };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.applyFilters();
    setTimeout(() => {
      this.animatedIn = true;
      this.startAnimation();
    }, 80);
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private startAnimation(): void {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
    this.lineProgress = 0;
    this.cropsBarProgress = 0;
    this.farmersBarProgress = 0;
    this.pieProgress = 0;
    this.startTime = null;

    const tick = (ts: number) => {
      if (!this.startTime) this.startTime = ts;
      const raw = Math.min((ts - this.startTime) / this.ANIM_DURATION, 1);
      const t   = this.easeInOut(raw);

      this.lineProgress = t;
      this.cropsBarProgress = t;
      this.farmersBarProgress = t;
      this.pieProgress = t * 360;
      this.cdr.markForCheck();

      if (raw < 1) {
        this.animFrameId = requestAnimationFrame(tick);
      } else {
        this.lineProgress = 1;
        this.cropsBarProgress = 1;
        this.farmersBarProgress = 1;
        this.pieProgress = 360;
        this.cdr.markForCheck();
      }
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  onFilterChange(): void {
    this.applyFilters();
    this.startAnimation();
  }

  private applyFilters(): void {
    const regionMultipliers: Record<string, number> = {
      'All Regions': 1, 'Centre': 1.05, 'Littoral': 0.9, 'West': 0.85,
      'South-West': 0.78, 'North-West': 0.82, 'South': 0.95
    };
    const cropKeys: (keyof Omit<ProductionData, 'month'>)[] = [
      'cocoa', 'coffee', 'palmOil', 'cotton', 'cassava', 'maize'
    ];
    const rm = regionMultipliers[this.selectedRegion] ?? 1;

    this.productionData = this.allProductionData.map(d => {
      const row: ProductionData = {
        month: d.month,
        cocoa: 0, coffee: 0, palmOil: 0, cotton: 0,
        cassava: 0, maize: 0
      };
      for (const k of cropKeys) {
        if (this.selectedCrop === 'All Crops' || this.cropLabel(k) === this.selectedCrop) {
          row[k] = Math.round(d[k] * rm);
        }
      }
      return row;
    });

    this.regionPerformance = this.selectedRegion === 'All Regions'
      ? [...this.allRegionPerformance]
      : this.allRegionPerformance.filter(r => r.name === this.selectedRegion);

    const cropMap: Record<string, string> = {
      'Cocoa': 'Cocoa', 'Coffee': 'Coffee', 'Palm Oil': 'Palm Oil',
      'Cotton': 'Cotton', 'Cassava': 'Cassava', 'Maize': 'Maize'
    };
    if (this.selectedCrop === 'All Crops') {
      this.cropDistribution = [...this.allCropDistribution];
    } else {
      const match = this.allCropDistribution.find(c => c.name === cropMap[this.selectedCrop]);
      this.cropDistribution = match ? [{ ...match, value: 100 }] : [...this.allCropDistribution];
    }

    this.loadCropsByRegionData();
    this.loadCropsByFarmersData();
  }

  private loadCropsByRegionData(): void {
    // Added cassava and maize production per region
    const regionProductionMap: Record<string, any> = {
      'Centre':     { cocoa: 18500, coffee: 12500, palmOil: 8800, cotton: 4200, cassava: 15400, maize: 12800 },
      'Littoral':   { cocoa: 12400, coffee: 8900,  palmOil: 15200, cotton: 3800, cassava: 13200, maize: 10400 },
      'West':       { cocoa: 9800,  coffee: 14200, palmOil: 6800,  cotton: 5600, cassava: 11600, maize: 9500 },
      'South-West': { cocoa: 22400, coffee: 5600,  palmOil: 12400, cotton: 2900, cassava: 18900, maize: 14200 },
      'North-West': { cocoa: 6700,  coffee: 7800,  palmOil: 5600,  cotton: 12500, cassava: 8700, maize: 13400 },
      'South':      { cocoa: 15300, coffee: 9100,  palmOil: 9500,  cotton: 7100, cassava: 12500, maize: 10500 }
    };

    this.cropsByRegionData = this.allRegionPerformance.map(region => {
      const prod = regionProductionMap[region.name] || { cocoa:0, coffee:0, palmOil:0, cotton:0, cassava:0, maize:0 };
      let cocoaVal = prod.cocoa;
      let coffeeVal = prod.coffee;
      let palmOilVal = prod.palmOil;
      let cottonVal = prod.cotton;
      let cassavaVal = prod.cassava;
      let maizeVal = prod.maize;
      
      if (this.selectedCrop !== 'All Crops') {
        if (this.selectedCrop !== 'Cocoa') cocoaVal = 0;
        if (this.selectedCrop !== 'Coffee') coffeeVal = 0;
        if (this.selectedCrop !== 'Palm Oil') palmOilVal = 0;
        if (this.selectedCrop !== 'Cotton') cottonVal = 0;
        if (this.selectedCrop !== 'Cassava') cassavaVal = 0;
        if (this.selectedCrop !== 'Maize') maizeVal = 0;
      }
      
      if (this.selectedRegion !== 'All Regions' && region.name !== this.selectedRegion) {
        cocoaVal = coffeeVal = palmOilVal = cottonVal = cassavaVal = maizeVal = 0;
      }
      
      const total = cocoaVal + coffeeVal + palmOilVal + cottonVal + cassavaVal + maizeVal;
      return {
        name: region.name,
        cocoa: cocoaVal, coffee: coffeeVal, palmOil: palmOilVal, cotton: cottonVal,
        cassava: cassavaVal, maize: maizeVal, total
      };
    }).filter(r => r.total > 0 || this.selectedRegion !== 'All Regions');
    
    this.cropsByRegionData.sort((a, b) => b.total - a.total);
  }

  private loadCropsByFarmersData(): void {
    // Added cassava and maize farmers data
    const farmersData: Record<string, Record<string, number>> = {
      'Cocoa': {
        'Centre': 2450, 'Littoral': 1890, 'West': 1560, 'South-West': 3420, 'North-West': 980, 'South': 2130
      },
      'Coffee': {
        'Centre': 1850, 'Littoral': 1240, 'West': 2340, 'South-West': 890, 'North-West': 1250, 'South': 1460
      },
      'Palm Oil': {
        'Centre': 980, 'Littoral': 2150, 'West': 1120, 'South-West': 1870, 'North-West': 890, 'South': 1340
      },
      'Cotton': {
        'Centre': 560, 'Littoral': 480, 'West': 890, 'South-West': 420, 'North-West': 1980, 'South': 950
      },
      'Cassava': {
        'Centre': 2100, 'Littoral': 1780, 'West': 1430, 'South-West': 2650, 'North-West': 1120, 'South': 1910
      },
      'Maize': {
        'Centre': 1850, 'Littoral': 1540, 'West': 1210, 'South-West': 2280, 'North-West': 1340, 'South': 1620
      }
    };

    const cropColors: Record<string, string> = {
      'Cocoa': '#8B4513',
      'Coffee': '#6B4423',
      'Palm Oil': '#228B22',
      'Cotton': '#E09000',
      'Cassava': '#B8860B',
      'Maize': '#DAA520'
    };

    this.cropsByFarmersData = Object.keys(farmersData).map(cropName => {
      const regionData = farmersData[cropName];
      let totalFarmers = 0;
      const regions = this.farmerRegions.map(region => {
        let count = regionData[region] || 0;
        
        if (this.selectedRegion !== 'All Regions' && region !== this.selectedRegion) {
          count = 0;
        }
        
        if (this.selectedCrop !== 'All Crops' && cropName !== this.selectedCrop) {
          count = 0;
        }
        
        totalFarmers += count;
        return { name: region, count };
      }).filter(r => r.count > 0 || this.selectedRegion === 'All Regions');
      
      return {
        cropName: cropName,
        color: cropColors[cropName],
        totalFarmers: totalFarmers,
        regions: regions
      };
    }).filter(crop => crop.totalFarmers > 0 || this.selectedCrop !== 'All Crops');
    
    this.cropsByFarmersData.sort((a, b) => b.totalFarmers - a.totalFarmers);
  }

  private cropLabel(key: string): string {
    return ({
      cocoa: 'Cocoa', coffee: 'Coffee', palmOil: 'Palm Oil', cotton: 'Cotton',
      cassava: 'Cassava', maize: 'Maize'
    } as any)[key] ?? key;
  }

  get visibleCropKeys(): (keyof Omit<ProductionData, 'month'>)[] {
    const all: (keyof Omit<ProductionData, 'month'>)[] = [
      'cocoa', 'coffee', 'palmOil', 'cotton', 'cassava', 'maize'
    ];
    if (this.selectedCrop === 'All Crops') return all;
    const map: Record<string, keyof Omit<ProductionData, 'month'>> = {
      'Cocoa': 'cocoa', 'Coffee': 'coffee', 'Palm Oil': 'palmOil',
      'Cotton': 'cotton', 'Cassava': 'cassava', 'Maize': 'maize'
    };
    return map[this.selectedCrop] ? [map[this.selectedCrop]] : all;
  }

  private getPointCoords(dataKey: keyof Omit<ProductionData, 'month'>): { x: number; y: number }[] {
    const values     = this.productionData.map(d => d[dataKey] as number);
    const maxVal     = 65000;
    const minVal     = 0;
    const usableW    = this.chartWidth - this.chartPaddingLeft - 20;
    const usableH    = this.chartHeight - this.chartPaddingBottom - this.chartPaddingTop;
    const step       = usableW / Math.max(values.length - 1, 1);
    return values.map((v, i) => ({
      x: this.chartPaddingLeft + i * step,
      y: this.chartPaddingTop + usableH - ((v - minVal) / (maxVal - minVal)) * usableH
    }));
  }

  getLinePoints(dataKey: keyof Omit<ProductionData, 'month'>): string {
    return this.getPointCoords(dataKey).map(p => `${p.x},${p.y}`).join(' ');
  }

  getAreaPoints(dataKey: keyof Omit<ProductionData, 'month'>): string {
    const coords  = this.getPointCoords(dataKey);
    const usableH = this.chartHeight - this.chartPaddingBottom - this.chartPaddingTop;
    const baseY   = this.chartPaddingTop + usableH;
    const top     = coords.map(p => `${p.x},${p.y}`).join(' ');
    return `${coords[0].x},${baseY} ${top} ${coords[coords.length - 1].x},${baseY}`;
  }

  getDotPositions(dataKey: keyof Omit<ProductionData, 'month'>): { x: number; y: number }[] {
    return this.getPointCoords(dataKey);
  }

  getPathLength(dataKey: keyof Omit<ProductionData, 'month'>): number {
    const pts = this.getPointCoords(dataKey);
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i-1].x;
      const dy = pts[i].y - pts[i-1].y;
      len += Math.sqrt(dx*dx + dy*dy);
    }
    return len || 600;
  }

  getDashOffset(dataKey: keyof Omit<ProductionData, 'month'>): number {
    const len = this.getPathLength(dataKey);
    return len * (1 - this.lineProgress);
  }

  getYAxisLabels(): number[] {
    return [60000, 45000, 30000, 15000, 0];
  }

  getXLabels(): string[] {
    return this.productionData.map(d => d.month);
  }

  getXLabelPositions(): number[] {
    const usableW = this.chartWidth - this.chartPaddingLeft - 20;
    const step    = usableW / Math.max(this.productionData.length - 1, 1);
    return this.productionData.map((_, i) => this.chartPaddingLeft + i * step);
  }

  getPieSegments(): { path: string; color: string; name: string; value: number }[] {
    const cx = 120, cy = 120, outerR = 100, innerR = 58;
    const total = this.cropDistribution.reduce((s, c) => s + c.value, 0);
    let startAngle = -Math.PI / 2;
    
    const maxSweepRadians = (this.pieProgress / 360) * 2 * Math.PI;
    let accumulatedSweep = 0;

    return this.cropDistribution.map(crop => {
      const fullSweep = (crop.value / total) * 2 * Math.PI;
      const sweep = Math.min(fullSweep, Math.max(0, maxSweepRadians - accumulatedSweep));
      accumulatedSweep += fullSweep;

      if (sweep <= 0.001) return { path: '', color: crop.color, name: crop.name, value: crop.value };

      const endAngle = startAngle + sweep - 0.03;
      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);
      const x3 = cx + innerR * Math.cos(endAngle);
      const y3 = cy + innerR * Math.sin(endAngle);
      const x4 = cx + innerR * Math.cos(startAngle);
      const y4 = cy + innerR * Math.sin(startAngle);
      const la = sweep > Math.PI ? 1 : 0;
      const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${la} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${la} 0 ${x4} ${y4} Z`;

      startAngle += fullSweep;
      return { path, color: crop.color, name: crop.name, value: crop.value };
    });
  }

  // ── Crops by Region Chart Helpers ──
  getBarHeight(value: number): number {
    const maxVal = 25000;
    const usableH = this.cropsChartHeight - this.cropsChartPaddingBottom - this.cropsChartPaddingTop;
    return (value / maxVal) * usableH;
  }

  getBarY(value: number): number {
    const usableH = this.cropsChartHeight - this.cropsChartPaddingBottom - this.cropsChartPaddingTop;
    const barHeight = this.getBarHeight(value);
    return this.cropsChartPaddingTop + usableH - barHeight;
  }

  getCropsYAxisLabels(): number[] {
    return [25000, 18750, 12500, 6250, 0];
  }

  getCropTotal(crop: 'cocoa' | 'coffee' | 'palmOil' | 'cotton' | 'cassava' | 'maize'): number {
    return this.cropsByRegionData.reduce((sum, r) => sum + r[crop], 0);
  }

  getGrandTotal(): number {
    return this.cropsByRegionData.reduce((sum, r) => sum + r.total, 0);
  }

  // ── Crops by Farmers Chart Helpers ──
  getFarmersBarHeight(value: number): number {
    const maxVal = 5000;
    const usableH = this.farmersChartHeight - this.farmersChartPaddingBottom - this.farmersChartPaddingTop;
    return (value / maxVal) * usableH;
  }

  getFarmersBarY(value: number): number {
    const usableH = this.farmersChartHeight - this.farmersChartPaddingBottom - this.farmersChartPaddingTop;
    const barHeight = this.getFarmersBarHeight(value);
    return this.farmersChartPaddingTop + usableH - barHeight;
  }

  getFarmersYAxisLabels(): number[] {
    return [5000, 3750, 2500, 1250, 0];
  }

  getFarmersByRegion(cropName: string, region: string): number {
    const crop = this.cropsByFarmersData.find(c => c.cropName === cropName);
    const regionData = crop?.regions.find(r => r.name === region);
    return regionData?.count || 0;
  }

  getTotalFarmersAll(): number {
    return this.cropsByFarmersData.reduce((sum, crop) => sum + crop.totalFarmers, 0);
  }

  getTotalFarmersByRegion(region: string): number {
    return this.cropsByFarmersData.reduce((sum, crop) => {
      const regionData = crop.regions.find(r => r.name === region);
      return sum + (regionData?.count || 0);
    }, 0);
  }

  // ── Tooltips ──
  showLineTooltip(index: number, event: MouseEvent): void {
    const d = this.productionData[index];
    const wrapper = (event.target as SVGElement).closest('.svg-chart-wrapper')!.getBoundingClientRect();
    this.lineTooltip = {
      visible: true,
      x: event.clientX - wrapper.left + 12,
      y: event.clientY - wrapper.top - 10,
      month: d.month,
      cocoa: d.cocoa, coffee: d.coffee, palmOil: d.palmOil, cotton: d.cotton,
      cassava: d.cassava, maize: d.maize
    };
  }
  
  hideLineTooltip(): void { this.lineTooltip.visible = false; }

  showPieTooltip(seg: { name: string; value: number }, event: MouseEvent): void {
    const wrapper = (event.target as SVGElement).closest('.pie-wrapper')!.getBoundingClientRect();
    this.pieTooltip = {
      visible: true,
      x: event.clientX - wrapper.left + 12,
      y: event.clientY - wrapper.top - 10,
      name: seg.name,
      value: seg.value
    };
  }
  
  hidePieTooltip(): void { this.pieTooltip.visible = false; }

  showCropsBarTooltip(region: CropsByRegion, crop: string, event: MouseEvent): void {
    const value = region[crop as keyof CropsByRegion] as number;
    const cropNames: Record<string, string> = {
      cocoa: 'Cocoa', coffee: 'Coffee', palmOil: 'Palm Oil', cotton: 'Cotton',
      cassava: 'Cassava', maize: 'Maize'
    };
    const wrapper = (event.target as SVGElement).closest('.crops-chart-wrapper')!.getBoundingClientRect();
    this.cropsBarTooltip = {
      visible: true,
      x: event.clientX - wrapper.left + 12,
      y: event.clientY - wrapper.top - 10,
      region: region.name,
      cropName: cropNames[crop] || crop,
      value: value
    };
  }

  hideCropsBarTooltip(): void {
    this.cropsBarTooltip.visible = false;
  }

  showFarmersBarTooltip(crop: CropsByFarmers, event: MouseEvent): void {
    const wrapper = (event.target as SVGElement).closest('.farmers-chart-wrapper')!.getBoundingClientRect();
    this.farmersBarTooltip = {
      visible: true,
      x: event.clientX - wrapper.left + 12,
      y: event.clientY - wrapper.top - 10,
      cropName: crop.cropName,
      totalFarmers: crop.totalFarmers,
      regions: crop.regions.filter(r => r.count > 0)
    };
  }

  hideFarmersBarTooltip(): void {
    this.farmersBarTooltip.visible = false;
  }

  // ── Status helpers ──
  getStatusClass(status: string): string {
    return ({ excellent: 'badge-excellent', good: 'badge-good', fair: 'badge-fair', 'needs-attention': 'badge-attention' } as any)[status] ?? '';
  }
  
  getWeatherStatusClass(status: string): string {
    return ({ optimal: 'status-optimal', good: 'status-good', fair: 'status-fair', poor: 'status-poor' } as any)[status] ?? '';
  }
  
  getAlertBorderClass(severity: string): string {
    return ({ high: 'alert-high', medium: 'alert-medium', low: 'alert-low' } as any)[severity] ?? '';
  }
  
  getAlertBadgeClass(severity: string): string {
    return ({ high: 'alert-badge-high', medium: 'alert-badge-medium', low: 'alert-badge-low' } as any)[severity] ?? '';
  }
  
  formatStatusLabel(status: string): string { return status.replace('-', ' '); }

  cropColor(key: string): string {
    return ({
      cocoa: '#8B4513', coffee: '#6B4423', palmOil: '#228B22', cotton: '#E09000',
      cassava: '#B8860B', maize: '#DAA520'
    } as any)[key] ?? '#999';
  }
  
  cropName(key: string): string {
    return ({
      cocoa: 'Cocoa', coffee: 'Coffee', palmOil: 'Palm Oil', cotton: 'Cotton',
      cassava: 'Cassava', maize: 'Maize'
    } as any)[key] ?? key;
  }
}