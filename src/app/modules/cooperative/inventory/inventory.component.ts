import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { InventoryService } from './inventory.service';
import { InventoryItem, InventorySummary } from './inventory.model';
import { AuthService } from '../../../core/services/auth.service';

interface DashboardMetrics {
  totalInventoryValue: string;
  totalInventoryPercent: string;
  totalItems: number;
  totalItemsPercent: string;
  lowStockItems: number;
  lowStockPercent: string;
  outOfStockItems: number;
  outOfStockPercent: string;
  criticalItems: number;
  criticalPercent: string;
  farmerProductsStock: string;
  farmerProductsPercent: string;
}


@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  providers: [InventoryService]
})

export class InventoryComponent implements OnInit {

  // Section state getters
  get isInventorySectionActive(): boolean {
    const inventoryBtn = this.actionButtons.find(btn => btn.name === 'Inventory');
    return inventoryBtn ? inventoryBtn.active : false;
  }

  // User info from auth service
  user = {
    name: '',
    role: '',
    initials: '',
    cooperativeId: ''
  };

  // Action buttons for different sections
  actionButtons = [
    {
      name: 'Inventory',
      icon: 'fas fa-boxes',
      active: true
    }
  ];

  // Dashboard metrics
  totalInventoryValue = '0 XAF';
  totalInventoryPercent = '0%';
  totalItems = 0;
  totalItemsPercent = '0%';
  lowStockItems = 0;
  lowStockPercent = '0%';
  outOfStockItems = 0;
  outOfStockPercent = '0%';
  criticalItems = 0;
  criticalPercent = '0%';
  farmerProductsStock = '0 MT';
  farmerProductsPercent = '0%';

  // Search and filters
  searchQuery = '';
  selectedCategory = 'all';
  selectedStatus = 'all';
  activeTab: 'products' | 'inputs' | 'livestock' = 'products';

  // Data
  allItems: InventoryItem[] = [];
  filteredItems: InventoryItem[] = [];
  summary: InventorySummary | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Modal states
  showAddModal    = false;
  showEditModal   = false;
  showViewModal   = false;
  showExportModal = false;
  currentItem: InventoryItem | null = null;
  addModalTab: 'products' | 'inputs' | 'livestock' = 'products';

  // Export options
  exportFormat: 'csv' | 'pdf' = 'csv';
  exportScope:  'inventory' | 'summary' | 'both' = 'both';

  // Form data
  formData: InventoryItem = this.getEmptyFormData();

  // Loading state
  isLoading = false;
  errorMessage = '';

  // Categories
  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Cocoa', label: 'Cocoa' },
    { value: 'Coffee', label: 'Coffee' },
    { value: 'Cotton', label: 'Cotton' },
    { value: 'Palm Oil', label: 'Palm Oil' },
    { value: 'Cassava', label: 'Cassava' },
    { value: 'Maize', label: 'Maize' },
    { value: 'Seeds', label: 'Seeds & Seedlings' },
    { value: 'Fertilizers', label: 'Fertilizers' },
    { value: 'Equipment', label: 'Equipment & Tools' },
    { value: 'Livestock Feed', label: 'Livestock Feed' },
    { value: 'Cattle', label: 'Cattle' },
    { value: 'Goats', label: 'Goats' },
    { value: 'Poultry', label: 'Poultry' },
    { value: 'Pigs', label: 'Pigs' },
    { value: 'Sheep', label: 'Sheep' }
  ];

  // Statuses
  statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'IN_STOCK', label: 'In Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' }
  ];

  // Locations
  locations = [
    'Douala Warehouse',
    'Yaoundé Warehouse',
    'Garoua Warehouse',
    'Central Depot',
    'Yaoundé Depot',
    'Garoua Depot',
    'Ranch A - Adamawa',
    'Farm B - North Region',
    'Poultry Farm C - West',
    'Farm D - Centre',
    'Ranch E - Northwest'
  ];

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadInventoryData();
    this.loadSummary();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      let cooperativeId = currentUser.cooperativeId;
      if (!cooperativeId && currentUser.role === 'COOPERATIVE') {
        cooperativeId = currentUser.userId;
      }

      this.user = {
        name: currentUser.username || currentUser.email || 'User',
        role: this.formatRole(currentUser.role),
        initials: this.getInitials(currentUser.username || currentUser.email || 'User'),
        cooperativeId: cooperativeId || ''
      };
    }
  }

  // Handle action button clicks
  onActionButtonClick(buttonName: string): void {
    this.actionButtons.forEach(btn => btn.active = false);
    const clickedButton = this.actionButtons.find(btn => btn.name === buttonName);
    if (clickedButton) {
      clickedButton.active = true;
    }
  }

  formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'COOPERATIVE': 'Cooperative Manager',
      'FARMER': 'Farmer',
      'GOVERNMENT': 'Government Official'
    };
    return roleMap[role] || role;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  loadInventoryData(): void {
    this.isLoading = true;
    this.inventoryService.getAllInventory().subscribe({
      next: (items) => {
        this.allItems = items;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load inventory data';
        this.isLoading = false;
        console.error('Error loading inventory:', error);
      }
    });
  }

  loadSummary(): void {
    this.inventoryService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.updateDashboardMetrics(summary);
      },
      error: (error) => {
        console.error('Error loading summary:', error);
        this.loadMockMetrics();
      }
    });
  }

  updateDashboardMetrics(summary: InventorySummary): void {
    // Format total inventory value
    this.totalInventoryValue = this.formatValue(summary.totalInventoryValue);
    this.totalInventoryPercent = `+${summary.percentageChange.toFixed(1)}%`;

    // Total items
    this.totalItems = summary.totalItems;
    this.totalItemsPercent = '+5.2%'; // Mock percentage for now

    // Stock status metrics
    this.lowStockItems = summary.lowStockItems;
    this.lowStockPercent = `${((summary.lowStockItems / summary.totalItems) * 100).toFixed(1)}% of total`;

    this.outOfStockItems = summary.outOfStockItems;
    this.outOfStockPercent = `${((summary.outOfStockItems / summary.totalItems) * 100).toFixed(1)}% of total`;

    this.criticalItems = summary.criticalStockItems;
    this.criticalPercent = `${((summary.criticalStockItems / summary.totalItems) * 100).toFixed(1)}% of total`;

    // Farmer products stock
    this.farmerProductsStock = `${summary.farmerProductsStock.toFixed(1)} MT`;
    this.farmerProductsPercent = '+8.3%';
  }

  loadMockMetrics(): void {
    this.totalInventoryValue = '45,250,000 XAF';
    this.totalInventoryPercent = '+12.5%';
    this.totalItems = 245;
    this.totalItemsPercent = '+5.2%';
    this.lowStockItems = 18;
    this.lowStockPercent = '7.3% of total';
    this.outOfStockItems = 5;
    this.outOfStockPercent = '2.0% of total';
    this.criticalItems = 12;
    this.criticalPercent = '4.9% of total';
    this.farmerProductsStock = '156.8 MT';
    this.farmerProductsPercent = '+8.3%';
  }

  applyFilters(): void {
    let filtered = [...this.allItems];

    // Filter by tab type
    filtered = filtered.filter(item => this.matchesTab(item));

    // Filter by search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(query) ||
        item.itemId.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === this.selectedStatus);
    }

    this.filteredItems = filtered;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
  }

  matchesTab(item: InventoryItem): boolean {
    if (this.activeTab === 'products') {
      return item.itemId.startsWith('PRO') || item.itemType === 'FARMER_PRODUCT';
    } else if (this.activeTab === 'inputs') {
      return item.itemId.startsWith('INP') || item.itemType === 'INPUT_SUPPLY';
    } else {
      return item.itemId.startsWith('LIV') || item.itemType === 'LIVESTOCK';
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  switchTab(tab: 'products' | 'inputs' | 'livestock'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  // Pagination
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Modal actions
  openAddModal(): void {
    this.formData = this.getEmptyFormData();
    this.addModalTab = 'products';
    this.showAddModal = true;
  }

  updateFormCategory(): void {
    // Update formData based on selected tab
    if (this.addModalTab === 'products') {
      this.formData.unit = 'MT';
      this.formData.itemId = 'PRO' + Date.now().toString().slice(-3);
    } else if (this.addModalTab === 'inputs') {
      this.formData.unit = 'units';
      this.formData.itemId = 'INP' + Date.now().toString().slice(-3);
    } else {
      this.formData.unit = 'heads';
      this.formData.itemId = 'LIV' + Date.now().toString().slice(-3);
    }
  }

  onProductSelect(): void {
    // Map product name to category
    const productCategoryMap: { [key: string]: string } = {
      'Cocoa Beans': 'Cocoa',
      'Coffee Beans': 'Coffee',
      'Cotton': 'Cotton',
      'Palm Oil': 'Palm Oil',
      'Cassava': 'Cassava',
      'Maize': 'Maize'
    };

    if (this.formData.itemName) {
      this.formData.category = productCategoryMap[this.formData.itemName] || this.formData.itemName;
    }
  }

  openEditModal(item: InventoryItem): void {
    this.currentItem = item;
    this.formData = { ...item };
    this.showEditModal = true;
  }

  openViewModal(item: InventoryItem): void {
    this.currentItem = item;
    this.showViewModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showViewModal = false;
    this.currentItem = null;
    this.errorMessage = '';
  }

  onSaveAdd(): void {
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.inventoryService.createInventoryItem(this.formData).subscribe({
      next: (item) => {
        this.loadInventoryData();
        this.loadSummary();
        this.closeModals();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to create item';
        this.isLoading = false;
        console.error('Error creating item:', error);
      }
    });
  }

  onSaveEdit(): void {
    if (!this.validateForm() || !this.currentItem?.id) return;

    this.isLoading = true;
    this.inventoryService.updateInventoryItem(this.currentItem.id, this.formData).subscribe({
      next: (item) => {
        this.loadInventoryData();
        this.loadSummary();
        this.closeModals();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to update item';
        this.isLoading = false;
        console.error('Error updating item:', error);
      }
    });
  }

  onDelete(item: InventoryItem): void {
    if (!item.id) return;

    if (confirm(`Are you sure you want to delete ${item.itemName}?`)) {
      this.inventoryService.deleteInventoryItem(item.id).subscribe({
        next: () => {
          this.loadInventoryData();
          this.loadSummary();
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete item';
          console.error('Error deleting item:', error);
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.itemId || !this.formData.itemName || !this.formData.category) {
      this.errorMessage = 'Please fill in all required fields';
      return false;
    }
    if (this.formData.quantity < 0 || this.formData.minimumQuantity < 0) {
      this.errorMessage = 'Quantities must be positive numbers';
      return false;
    }
    return true;
  }

  exportInventory(): void {
    console.log('Export inventory data');
    // TODO: Implement export functionality
    alert('Export functionality will be implemented soon');
  }

  addNewItem(): void {
    console.log('Add new inventory item');
    this.openAddModal();
  }

  getEmptyFormData(): InventoryItem {
    return {
      itemId: '',
      itemName: '',
      category: '',
      quantity: 0,
      minimumQuantity: 0,
      unit: 'MT',
      valueXAF: 0,
      location: '',
      status: 'IN_STOCK',
      trend: 'STABLE'
    };
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  onExport(): void {
    this.showExportModal = true;
  }

  closeExportModal(): void {
    this.showExportModal = false;
  }

  runExport(): void {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (this.exportFormat === 'csv') {
      if (this.exportScope === 'inventory' || this.exportScope === 'both') {
        this.exportInventoryCSV(timestamp);
      }
      if (this.exportScope === 'summary' || this.exportScope === 'both') {
        this.exportSummaryCSV(timestamp);
      }
    } else {
      this.exportPDF(timestamp);
    }

    this.closeExportModal();
  }

  // ── CSV ─────────────────────────────────────────────────────────────────────

  private exportInventoryCSV(timestamp: string): void {
    const data: string[][] = [
      ['Item ID', 'Item Name', 'Category', 'Type', 'Quantity', 'Unit',
       'Min Quantity', 'Value (XAF)', 'Location', 'Status', 'Trend'],
      ...this.filteredItems.map(item => [
        item.itemId,
        item.itemName,
        item.category,
        item.itemType || '',
        String(item.quantity),
        item.unit,
        String(item.minimumQuantity),
        String(item.valueXAF),
        item.location,
        this.getStatusLabel(item.status),
        item.trend || 'STABLE'
      ])
    ];
    this.downloadCSV(data, `inventory-items-${timestamp}.csv`);
  }

  private exportSummaryCSV(timestamp: string): void {
    const data: string[][] = [
      ['INVENTORY SUMMARY'],
      ['Metric', 'Value', 'Change'],
      ['Total Inventory Value', this.totalInventoryValue, this.totalInventoryPercent],
      ['Total Items',           String(this.totalItems),   this.totalItemsPercent],
      ['Low Stock Items',       String(this.lowStockItems), this.lowStockPercent],
      ['Out of Stock Items',    String(this.outOfStockItems), this.outOfStockPercent],
      ['Critical Stock Items',  String(this.criticalItems), this.criticalPercent],
      ['Farmer Products Stock', this.farmerProductsStock,  this.farmerProductsPercent],
      [],
      ['BY CATEGORY'],
      ['Category', 'Item Count', 'Total Value (XAF)', 'Avg Qty'],
      ...this.getCategoryBreakdown(),
      [],
      ['BY STATUS'],
      ['Status', 'Count', '% of Total'],
      ...this.getStatusBreakdown(),
    ];
    this.downloadCSV(data, `inventory-summary-${timestamp}.csv`);
  }

  private getCategoryBreakdown(): string[][] {
    const map = new Map<string, { count: number; value: number; qty: number }>();
    this.filteredItems.forEach(item => {
      const e = map.get(item.category) || { count: 0, value: 0, qty: 0 };
      e.count++;
      e.value += item.valueXAF || 0;
      e.qty   += item.quantity || 0;
      map.set(item.category, e);
    });
    return Array.from(map.entries()).map(([cat, v]) => [
      cat,
      String(v.count),
      this.formatValue(v.value),
      (v.qty / v.count).toFixed(1)
    ]);
  }

  private getStatusBreakdown(): string[][] {
    const total = this.filteredItems.length || 1;
    const statuses = ['IN_STOCK', 'LOW_STOCK', 'CRITICAL', 'OUT_OF_STOCK'];
    return statuses.map(s => {
      const count = this.filteredItems.filter(i => i.status === s).length;
      return [this.getStatusLabel(s), String(count), ((count / total) * 100).toFixed(1) + '%'];
    });
  }

  private downloadCSV(data: string[][], filename: string): void {
    const csv = data
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────

  private exportPDF(timestamp: string): void {
    const html = this.buildInventoryPDF(timestamp);
    const win  = window.open('', '_blank', 'width=960,height=720');
    if (!win) { alert('Please allow popups to export PDF.'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  }

  private buildInventoryPDF(timestamp: string): string {
    const includeInventory = this.exportScope === 'inventory' || this.exportScope === 'both';
    const includeSummary   = this.exportScope === 'summary'   || this.exportScope === 'both';

    const summaryRows = [
      ['Total Inventory Value', this.totalInventoryValue, this.totalInventoryPercent],
      ['Total Items',           String(this.totalItems),   this.totalItemsPercent],
      ['Low Stock Items',       String(this.lowStockItems), this.lowStockPercent],
      ['Out of Stock Items',    String(this.outOfStockItems), this.outOfStockPercent],
      ['Critical Stock Items',  String(this.criticalItems), this.criticalPercent],
      ['Farmer Products Stock', this.farmerProductsStock,  this.farmerProductsPercent],
    ].map(r => `<tr><td>${r[0]}</td><td><strong>${r[1]}</strong></td><td>${r[2]}</td></tr>`).join('');

    const statusColor = (s: string) => ({
      'IN_STOCK':    '#d1fae5', 'LOW_STOCK': '#fff8e1',
      'CRITICAL':    '#fff3e0', 'OUT_OF_STOCK': '#ffd6d6'
    }[s] || '#f1f5f9');
    const statusText = (s: string) => ({
      'IN_STOCK':    '#059669', 'LOW_STOCK': '#a37e00',
      'CRITICAL':    '#e65100', 'OUT_OF_STOCK': '#e64a4a'
    }[s] || '#475569');

    const itemRows = this.filteredItems
      .map(item => `
        <tr>
          <td><span style="background:#e6f2d6;color:#328048;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700">${item.itemId}</span></td>
          <td>${item.itemName}</td>
          <td>${item.category}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>${this.formatValue(item.valueXAF)} XAF</td>
          <td>${item.location}</td>
          <td><span style="background:${statusColor(item.status)};color:${statusText(item.status)};padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600">${this.getStatusLabel(item.status)}</span></td>
        </tr>`)
      .join('') || '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:20px">No items match current filters</td></tr>';

    const tabLabel = this.activeTab === 'products' ? 'Farmer Products'
                   : this.activeTab === 'inputs'   ? 'Input Supplies' : 'Livestock';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Inventory Report – ${timestamp}</title>
<style>
  @page { margin: 18mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
  body { color: #1e293b; font-size: 12px; line-height: 1.4; }
  .header { background: #328048; color: white; padding: 18px 22px; border-radius: 8px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 3px; }
  .header p, .header .meta { font-size: 11px; opacity: 0.82; }
  .header .meta { text-align: right; }
  .section { margin-bottom: 24px; page-break-inside: avoid; }
  .section-title { font-size: 12px; font-weight: 700; color: #328048; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 4px; }
  .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .stat-value { font-size: 18px; font-weight: 700; color: #328048; }
  .stat-label { font-size: 10px; color: #64748b; margin: 2px 0; }
  .stat-note  { font-size: 10px; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f8fafc; color: #328048; padding: 7px 9px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
  td { padding: 6px 9px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 8px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>📦 Inventory Management Report</h1>
    <p>Agribind Cooperative Platform &bull; Cameroon</p>
  </div>
  <div class="meta">
    Generated: ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })}<br/>
    Tab: ${tabLabel} &bull; ${this.filteredItems.length} items
  </div>
</div>

${includeSummary ? `
<div class="section">
  <div class="section-title">Inventory Summary</div>
  <div class="stats-grid">
    <div class="stat-box"><div class="stat-value">${this.totalInventoryValue}</div><div class="stat-label">Total Value</div><div class="stat-note">${this.totalInventoryPercent}</div></div>
    <div class="stat-box"><div class="stat-value">${this.totalItems}</div><div class="stat-label">Total Items</div><div class="stat-note">${this.totalItemsPercent}</div></div>
    <div class="stat-box"><div class="stat-value">${this.farmerProductsStock}</div><div class="stat-label">Farmer Products</div><div class="stat-note">${this.farmerProductsPercent}</div></div>
    <div class="stat-box"><div class="stat-value">${this.lowStockItems}</div><div class="stat-label">Low Stock</div><div class="stat-note">${this.lowStockPercent}</div></div>
    <div class="stat-box"><div class="stat-value">${this.criticalItems}</div><div class="stat-label">Critical</div><div class="stat-note">${this.criticalPercent}</div></div>
    <div class="stat-box"><div class="stat-value">${this.outOfStockItems}</div><div class="stat-label">Out of Stock</div><div class="stat-note">${this.outOfStockPercent}</div></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Metrics Details</div>
  <table>
    <thead><tr><th>Metric</th><th>Value</th><th>Change / Note</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>
</div>` : ''}

${includeInventory ? `
<div class="section">
  <div class="section-title">${tabLabel} (${this.filteredItems.length} items)</div>
  <table>
    <thead>
      <tr><th>Item ID</th><th>Name</th><th>Category</th><th>Quantity</th><th>Value (XAF)</th><th>Location</th><th>Status</th></tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
</div>` : ''}

<div class="footer">Inventory Management &bull; Agribind &bull; Exported ${timestamp}</div>
</body>
</html>`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'IN_STOCK': return 'status-in-stock';
      case 'LOW_STOCK': return 'status-low-stock';
      case 'CRITICAL': return 'status-critical';
      case 'OUT_OF_STOCK': return 'status-out-of-stock';
      default: return 'status-in-stock';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IN_STOCK': return 'In Stock';
      case 'LOW_STOCK': return 'Low Stock';
      case 'CRITICAL': return 'Critical';
      case 'OUT_OF_STOCK': return 'Out of Stock';
      default: return status;
    }
  }


  getTrendClass(trend: string): string {
    switch (trend) {
      case 'UP': return 'trend-up';
      case 'DOWN': return 'trend-down';
      case 'STABLE': return 'trend-stable';
      default: return 'trend-stable';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'UP': return '↗️';
      case 'DOWN': return '↘️';
      default: return '→';
    }
  }

  formatValue(value: number): string {
    return value.toLocaleString('en-US');
  }

  formatQuantity(item: InventoryItem): string {
    return `${item.quantity} ${item.unit}`;
  }

}
