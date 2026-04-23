import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

// Removed unused interfaces - only Contract interface needed

interface Contract {
  id: string;
  type: string;
  member: string;
  product: string;
  quantity: string;
  value: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  // Additional fields for full contract management
  contractTitle?: string;
  farmerId?: string;
  farmerName?: string;
  cropType?: string;
  targetQuantity?: number;
  farmSize?: number;
  qualityStandard?: string;
  duration?: number;
  renewalOption?: string;
  pricingType?: string;
  agreedPrice?: number;
  paymentTerms?: string;
  advancePayment?: number;
  farmerObligations?: string;
  cooperativeObligations?: string;
  penaltyClause?: string;
  terminationClause?: string;
  notes?: string;
}

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContractsComponent implements OnInit {
  // User info
  user = {
    name: '',
    role: '',
    initials: '',
    cooperativeId: ''
  };

  // Tab management - removed, only contracts now

  // Search and filters
  searchQuery: string = '';
  selectedContractType: string = 'all';
  selectedContractStatus: string = 'all';

  // Removed sales stats - only contract stats now

  // Contract stats
  contractStats = [
    {
      label: 'Total Contracts',
      value: '287',
      change: '+18',
      changeLabel: 'new this month',
      icon: '📄',
      color: 'bg-primary',
      trend: 'up'
    },
    {
      label: 'Active Contracts',
      value: '245',
      change: '85.4%',
      changeLabel: 'of total',
      icon: '✅',
      color: 'bg-primary',
      trend: 'up'
    },
    {
      label: 'Pending Approval',
      value: '15',
      change: '5.2%',
      changeLabel: 'awaiting review',
      icon: '🕐',
      color: 'bg-secondary',
      trend: 'neutral'
    },
    {
      label: 'Expiring Soon',
      value: '12',
      change: '< 30 days',
      changeLabel: 'need renewal',
      icon: '⚠️',
      color: 'bg-secondary',
      trend: 'warning'
    }
  ];

  // Removed farmerContracts - using allContracts only

  // All contracts (for contract table)
  allContracts: Contract[] = [
    {
      id: 'CNT001',
      type: 'production',
      member: 'Kwame Osei (M001)',
      product: 'Cocoa Beans',
      quantity: '50 MT',
      value: '105,000,000 XAF',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      status: 'active',
      progress: 75
    },
    {
      id: 'CNT002',
      type: 'supply',
      member: 'Ama Boateng (M002)',
      product: 'Coffee Beans',
      quantity: '30 MT',
      value: '66,000,000 XAF',
      startDate: '2024-03-01',
      endDate: '2024-12-31',
      status: 'active',
      progress: 60
    },
    {
      id: 'CNT003',
      type: 'sales',
      member: 'Export Company Ltd',
      product: 'Mixed Crops',
      quantity: '200 MT',
      value: '420,000,000 XAF',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      progress: 82
    },
    {
      id: 'CNT004',
      type: 'production',
      member: 'Yaw Mensah (M003)',
      product: 'Cocoa Beans',
      quantity: '75 MT',
      value: '157,500,000 XAF',
      startDate: '2024-02-01',
      endDate: '2025-01-31',
      status: 'active',
      progress: 65
    },
    {
      id: 'CNT005',
      type: 'lease',
      member: 'Akosua Darko (M004)',
      product: 'Tractor Equipment',
      quantity: '1 unit',
      value: '2,400,000 XAF',
      startDate: '2024-06-01',
      endDate: '2024-11-30',
      status: 'active',
      progress: 90
    },
    {
      id: 'CNT006',
      type: 'production',
      member: 'Kofi Asante (M005)',
      product: 'Maize',
      quantity: '40 MT',
      value: '20,000,000 XAF',
      startDate: '2024-04-01',
      endDate: '2024-10-31',
      status: 'pending',
      progress: 0
    },
    {
      id: 'CNT007',
      type: 'supply',
      member: 'Abena Owusu (M006)',
      product: 'Palm Oil',
      quantity: '20 MT',
      value: '32,000,000 XAF',
      startDate: '2023-01-15',
      endDate: '2024-01-14',
      status: 'expired',
      progress: 100
    },
    {
      id: 'CNT008',
      type: 'service',
      member: 'AgriTech Services',
      product: 'Technical Advisory',
      quantity: '12 months',
      value: '18,000,000 XAF',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      progress: 78
    }
  ];

  // Filtered data
  filteredContracts: Contract[] = [];
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Modal states
  showNewContractDialog: boolean = false;
  showViewContractModal: boolean = false;
  showEditContractModal: boolean = false;
  selectedContract: any = null;

  // Contract creation form data
  contractForm = {
    // Basic Information
    farmerId: '',
    farmerName: '',
    contractType: '',
    contractTitle: '',

    // Production Details
    cropType: '',
    targetQuantity: '',
    farmSize: '',
    qualityStandard: 'premium',

    // Contract Period
    startDate: '',
    endDate: '',
    renewalOption: 'mutual',

    // Financial Terms
    pricingType: 'fixed',
    agreedPrice: '',
    paymentTerms: '30days',
    advancePayment: '',

    // Terms & Conditions
    farmerObligations: '',
    cooperativeObligations: '',
    penaltyClause: '',
    terminationClause: '',
    notes: ''
  };

  // Farmer search results
  farmerSearchResults: any[] = [
    { userId: 'F001', name: 'Jean Baptiste', phone: '+237 6XX XXX XXX', cropTypes: ['Cocoa'], landArea: 5.2 },
    { userId: 'F002', name: 'Marie Kouam', phone: '+237 6XX XXX XXX', cropTypes: ['Coffee'], landArea: 3.8 },
    { userId: 'F003', name: 'Paul Mbarga', phone: '+237 6XX XXX XXX', cropTypes: ['Palm Oil'], landArea: 7.1 },
    { userId: 'F004', name: 'Christine Ngo', phone: '+237 6XX XXX XXX', cropTypes: ['Cassava'], landArea: 4.5 },
    { userId: 'F005', name: 'André Tchoua', phone: '+237 6XX XXX XXX', cropTypes: ['Maize'], landArea: 6.3 }
  ];

  // Removed product types and status options - only contract filters now

  // Contract types
  contractTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'production', label: 'Production Agreement' },
    { value: 'supply', label: 'Supply Contract' },
    { value: 'sales', label: 'Sales Agreement' },
    { value: 'lease', label: 'Equipment Lease' },
    { value: 'service', label: 'Service Contract' }
  ];

  // Contract status options
  contractStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'expired', label: 'Expired' },
    { value: 'terminated', label: 'Terminated' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.applyFilters();
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

  // Tab switching removed - only contracts management

  get allFilteredContracts(): Contract[] {
    let filtered = [...this.allContracts];
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(contract =>
        contract.id.toLowerCase().includes(query) ||
        contract.member.toLowerCase().includes(query) ||
        contract.product.toLowerCase().includes(query)
      );
    }
    if (this.selectedContractType !== 'all') {
      filtered = filtered.filter(contract =>
        contract.type === this.selectedContractType
      );
    }
    if (this.selectedContractStatus !== 'all') {
      filtered = filtered.filter(contract =>
        contract.status === this.selectedContractStatus
      );
    }
    return filtered;
  }
  
  get paginatedContracts(): Contract[] {
    const filtered = this.allFilteredContracts;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  applyFilters(): void {
    this.currentPage = 1;
  }
  
  get Math() {
    return Math;
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onContractTypeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onContractStatusChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }
  
  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

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

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Helper methods for template
  getPaginationStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.allFilteredContracts.length);
  }

  getTotalItems(): number {
    return this.allFilteredContracts.length;
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'status-success';
      case 'pending':
      case 'pending signature':
        return 'status-warning';
      case 'cancelled':
      case 'expired':
        return 'status-danger';
      default:
        return 'status-default';
    }
  }

  getContractStatusBadge(status: string): string {
    switch (status) {
      case 'active':
        return 'badge-active';
      case 'pending':
        return 'badge-pending';
      case 'expired':
        return 'badge-expired';
      case 'terminated':
        return 'badge-terminated';
      default:
        return 'badge-default';
    }
  }

  getContractTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      production: 'Production',
      supply: 'Supply',
      sales: 'Sales',
      lease: 'Lease',
      service: 'Service'
    };
    return typeMap[type] || type;
  }

  getDaysRemaining(endDate: string): string {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return 'Expired';
    if (diff < 30) return `${diff} days left`;
    return `${diff} days`;
  }

  openNewContractDialog(): void {
    this.showNewContractDialog = true;
  }

  closeNewContractDialog(): void {
    this.showNewContractDialog = false;
  }

  viewContract(contract: Contract): void {
    this.selectedContract = contract;
    this.showViewContractModal = true;
  }

  editContract(contract: Contract): void {
    this.selectedContract = contract;
    this.showEditContractModal = true;
  }

  downloadContract(contract: Contract): void {
    console.log('Download contract:', contract.id);
    alert('Contract download functionality will be implemented');
  }

  deleteContract(contract: Contract): void {
    if (confirm(`Are you sure you want to delete contract ${contract.id}?`)) {
      const index = this.allContracts.findIndex(c => c.id === contract.id);
      if (index > -1) {
        this.allContracts.splice(index, 1);
        this.applyFilters();
        alert('Contract deleted successfully!');
      }
    }
  }

  // Modal management methods
  closeViewContractModal(): void {
    this.showViewContractModal = false;
    this.selectedContract = null;
  }

  closeEditContractModal(): void {
    this.showEditContractModal = false;
    this.selectedContract = null;
  }

  // Contract creation methods
  resetContractForm(): void {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1); // Default 1 year contract

    this.contractForm = {
      farmerId: '',
      farmerName: '',
      contractType: '',
      contractTitle: '',
      cropType: '',
      targetQuantity: '',
      farmSize: '',
      qualityStandard: 'premium',
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      renewalOption: 'mutual',
      pricingType: 'fixed',
      agreedPrice: '',
      paymentTerms: '30days',
      advancePayment: '',
      farmerObligations: '',
      cooperativeObligations: '',
      penaltyClause: '',
      terminationClause: '',
      notes: ''
    };
  }

  onFarmerChange(event: any): void {
    const farmerId = event.target.value;
    const farmer = this.farmerSearchResults.find(f => f.userId === farmerId);
    if (farmer) {
      this.selectFarmer(farmer);
    }
  }

  selectFarmer(farmer: any): void {
    this.contractForm.farmerId = farmer.userId;
    this.contractForm.farmerName = farmer.name;
    // Auto-fill crop type if farmer has only one crop
    if (farmer.cropTypes && farmer.cropTypes.length === 1) {
      this.contractForm.cropType = farmer.cropTypes[0];
    }
    if (farmer.landArea) {
      this.contractForm.farmSize = farmer.landArea.toString();
    }
  }

  calculateDuration(): number {
    if (this.contractForm.startDate && this.contractForm.endDate) {
      const start = new Date(this.contractForm.startDate);
      const end = new Date(this.contractForm.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // months
    }
    return 0;
  }

  validateContractForm(): boolean {
    if (!this.contractForm.farmerId || !this.contractForm.contractType ||
        !this.contractForm.contractTitle || !this.contractForm.cropType ||
        !this.contractForm.targetQuantity || !this.contractForm.startDate ||
        !this.contractForm.endDate) {
      alert('Please fill in all required fields.');
      return false;
    }

    const startDate = new Date(this.contractForm.startDate);
    const endDate = new Date(this.contractForm.endDate);
    const today = new Date();

    if (startDate < today) {
      alert('Start date cannot be in the past.');
      return false;
    }

    if (endDate <= startDate) {
      alert('End date must be after start date.');
      return false;
    }

    const quantity = parseFloat(this.contractForm.targetQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid target quantity.');
      return false;
    }

    if (this.contractForm.agreedPrice) {
      const price = parseFloat(this.contractForm.agreedPrice);
      if (isNaN(price) || price <= 0) {
        alert('Please enter a valid agreed price.');
        return false;
      }
    }

    return true;
  }

  createContract(): void {
    if (!this.validateContractForm()) {
      return;
    }

    console.log('Creating contract:', this.contractForm);

    // Create new contract object
    const newContract: Contract = {
      id: `CON-${String(this.allContracts.length + 1).padStart(3, '0')}`,
      type: this.contractForm.contractType,
      member: this.contractForm.farmerName,
      product: this.contractForm.cropType,
      quantity: this.contractForm.targetQuantity + ' MT',
      value: this.contractForm.agreedPrice ? `${this.contractForm.agreedPrice} XAF/MT` : 'Market Price',
      startDate: this.contractForm.startDate,
      endDate: this.contractForm.endDate,
      status: 'Active',
      progress: 0,
      // Additional fields
      contractTitle: this.contractForm.contractTitle,
      farmerId: this.contractForm.farmerId,
      farmerName: this.contractForm.farmerName,
      cropType: this.contractForm.cropType,
      targetQuantity: parseFloat(this.contractForm.targetQuantity),
      farmSize: parseFloat(this.contractForm.farmSize || '0'),
      qualityStandard: this.contractForm.qualityStandard,
      duration: this.calculateDuration(),
      renewalOption: this.contractForm.renewalOption,
      pricingType: this.contractForm.pricingType,
      agreedPrice: parseFloat(this.contractForm.agreedPrice || '0'),
      paymentTerms: this.contractForm.paymentTerms,
      advancePayment: parseFloat(this.contractForm.advancePayment || '0'),
      farmerObligations: this.contractForm.farmerObligations,
      cooperativeObligations: this.contractForm.cooperativeObligations,
      penaltyClause: this.contractForm.penaltyClause,
      terminationClause: this.contractForm.terminationClause,
      notes: this.contractForm.notes
    };

    // Add to contracts list
    this.allContracts.unshift(newContract);
    this.applyFilters();

    this.closeNewContractDialog();
    alert('Contract created successfully!');
  }

  updateContract(): void {
    if (!this.selectedContract) return;

    // Validate required fields
    if (!this.selectedContract.product || !this.selectedContract.quantity || !this.selectedContract.value) {
      alert('Please fill in all required fields');
      return;
    }

    // Find and update the contract
    const index = this.allContracts.findIndex(c => c.id === this.selectedContract!.id);
    if (index > -1) {
      this.allContracts[index] = { ...this.selectedContract };
      this.applyFilters();
      this.closeEditContractModal();
      alert('Contract updated successfully!');
    }
  }

  exportData(): void {
    console.log('Export data');
    alert('Export functionality will be implemented');
  }
}
