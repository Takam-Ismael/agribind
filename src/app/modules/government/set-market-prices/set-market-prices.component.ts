import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  // ← ADD THIS
import { FormsModule } from '@angular/forms';  


export interface PriceData {
  commodity: string;
  icon: string;
  currentPrice: number;
  yourPrice: number | null;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  status: 'Active' | 'Draft' | 'Expired';
  regions: string[];
  allRegions: boolean;
}

@Component({
  selector: 'app-set-market-prices',
    standalone: true, 
      imports: [CommonModule, FormsModule], 
  templateUrl: './set-market-prices.component.html',
  styleUrls: ['./set-market-prices.component.scss']
})
export class SetMarketPricesComponent implements OnInit {

  // ── Form state ────────────────────────────────────────────
  selectedCommodity: string = '';
  priceInput: string = '';
  effectiveDate: string = '';    // bound as string from <input type="date">
  expirationDate: string = '';
  allRegions: boolean = true;
  selectedRegions: string[] = [];

  // ── Static data ───────────────────────────────────────────
  commodities = [
    { name: 'Cocoa',    icon: '🍫', currentPrice: 1200, yourPrice: 1500, status: 'Active'  as const },
    { name: 'Coffee',   icon: '☕', currentPrice:  950, yourPrice: 1100, status: 'Active'  as const },
    { name: 'Palm Oil', icon: '🌴', currentPrice:  800, yourPrice:  850, status: 'Draft'   as const },
    { name: 'Cotton',   icon: '🌿', currentPrice:  650, yourPrice:  650, status: 'Active'  as const },
    { name: 'Cassava',  icon: '🥔', currentPrice:  200, yourPrice:  220, status: 'Active'  as const },
    { name: 'Maize',    icon: '🌽', currentPrice:  180, yourPrice: null, status: 'Expired' as const },
  ];

  regions: string[] = [
    'Centre', 'Littoral', 'West', 'South-West', 'North-West',
    'Adamawa', 'North', 'Far North', 'East', 'South'
  ];

  priceData: PriceData[] = [];

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    const now = new Date();
    const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    this.priceData = this.commodities.map(c => ({
      commodity:      c.name,
      icon:           c.icon,
      currentPrice:   c.currentPrice,
      yourPrice:      c.yourPrice,
      effectiveDate:  c.yourPrice ? now          : null,
      expirationDate: c.yourPrice ? inThirtyDays : null,
      status:         c.status,
      regions:        [],
      allRegions:     true
    }));
  }

  // ── Commodity selection ───────────────────────────────────
  selectCommodity(name: string): void {
    this.selectedCommodity = name;

    // Pre-fill price with current "yourPrice" for quick editing
    const existing = this.priceData.find(p => p.commodity === name);
    if (existing?.yourPrice) {
      this.priceInput = existing.yourPrice.toString();
    } else {
      this.priceInput = '';
    }
  }

  // ── Region helpers ────────────────────────────────────────
  isRegionSelected(region: string): boolean {
    return this.selectedRegions.includes(region);
  }

  toggleRegion(region: string): void {
    const idx = this.selectedRegions.indexOf(region);
    if (idx === -1) {
      this.selectedRegions = [...this.selectedRegions, region];
    } else {
      this.selectedRegions = this.selectedRegions.filter(r => r !== region);
    }
  }

  // ── Price update ──────────────────────────────────────────
  handlePriceUpdate(): void {
    if (!this.selectedCommodity || !this.priceInput) return;

    const newPrice    = parseFloat(this.priceInput);
    const effDate     = this.effectiveDate   ? new Date(this.effectiveDate)   : null;
    const expDate     = this.expirationDate  ? new Date(this.expirationDate)  : null;

    this.priceData = this.priceData.map(item =>
      item.commodity === this.selectedCommodity
        ? {
            ...item,
            yourPrice:      newPrice,
            effectiveDate:  effDate,
            expirationDate: expDate,
            status:         'Draft' as const,
            allRegions:     this.allRegions,
            regions:        this.allRegions ? [] : [...this.selectedRegions]
          }
        : item
    );

    this.resetForm();
  }

  private resetForm(): void {
    this.selectedCommodity = '';
    this.priceInput        = '';
    this.effectiveDate     = '';
    this.expirationDate    = '';
    this.selectedRegions   = [];
  }

  // ── Publish ───────────────────────────────────────────────
  publishPrice(commodity: string): void {
    this.priceData = this.priceData.map(item =>
      item.commodity === commodity
        ? { ...item, status: 'Active' as const }
        : item
    );
  }

  // ── Edit (pre-fill form) ──────────────────────────────────
  editPrice(item: PriceData): void {
    this.selectedCommodity = item.commodity;
    this.priceInput        = item.yourPrice?.toString() ?? '';
    this.allRegions        = item.allRegions;
    this.selectedRegions   = [...item.regions];
    this.effectiveDate     = item.effectiveDate
      ? this.toInputDateString(item.effectiveDate)
      : '';
    this.expirationDate    = item.expirationDate
      ? this.toInputDateString(item.expirationDate)
      : '';
  }

  private toInputDateString(date: Date): string {
    // Returns 'YYYY-MM-DD' required by <input type="date">
    return date.toISOString().substring(0, 10);
  }

  // ── Display helpers ───────────────────────────────────────
  getPriceChange(item: PriceData): number {
    if (!item.yourPrice || !item.currentPrice) return 0;
    return ((item.yourPrice - item.currentPrice) / item.currentPrice) * 100;
  }

  getPriceChangeClass(item: PriceData): string {
    const change = this.getPriceChange(item);
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':  return 'status-active';
      case 'Draft':   return 'status-draft';
      case 'Expired': return 'status-expired';
      default:        return '';
    }
  }
}