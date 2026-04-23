import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

interface Cooperative {
  id: string;
  name: string;
  region: string;
  type: string;
  registrationNumber?: string;
  contactPerson?: string;
    phoneNumber?: string;
  totalMembers: number;
  activeMemberCount: number;
  status: string;
  establishmentYear?: number;
  adminName?: string;
  adminEmail?: string;
}

interface CoopAdmin {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
  cooperativeId?: string;
  cooperativeName?: string;
  region?: string;
}

@Component({
  selector: 'app-cooperative-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cooperative-management.component.html',
  styleUrls: ['./cooperative-management.component.scss']
})
export class CooperativeManagementComponent implements OnInit, OnDestroy {

  private readonly API = 'https://user-management-service-latest-11x8.onrender.com/api/v1'; // 'http://localhost:8222/api/v1'
  private destroy$ = new Subject<void>();

  // Data
  cooperatives: Cooperative[] = [];
  coopAdmins: CoopAdmin[] = [];
  filteredCooperatives: Cooperative[] = [];

  // Stats
  totalCooperatives = 0;
  activeCooperatives = 0;
  totalAdmins = 0;
  totalRegions = 0;

  // UI state
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';
  selectedRegion = 'All';
  selectedStatus = 'All';
  activeTab: 'cooperatives' | 'admins' = 'cooperatives';

  // Create Cooperative Modal
  showCoopModal = false;
  isSubmittingCoop = false;
  coopForm = {
    name: '', region: '', cooperativeType: 'AGRICULTURAL',
    legalRegistrationNumber: '', establishmentYear: new Date().getFullYear(),
    contactPerson: '', phoneNumber: ''
  };

  // Create Admin Modal
  showAdminModal = false;
  isSubmittingAdmin = false;
  adminForm = {
    name: '', email: '', phoneNumber: '',
    region: '', cooperativeId: ''
  };

  // View Cooperative Modal
  showViewModal = false;
  selectedCooperative: Cooperative | null = null;

  // Current user
  currentUser: any;

  readonly regions = [
    'All', 'Adamaoua', 'Centre', 'Est', 'Extrême-Nord',
    'Littoral', 'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
  ];
  readonly cooperativeTypes = ['AGRICULTURAL', 'LIVESTOCK', 'FISHERY', 'MIXED'];
  readonly statusOptions = ['All', 'ACTIVE', 'INACTIVE', 'PENDING'];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadCooperatives();
    this.loadCoopAdmins();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ──────────────────────────────────────────────────────
  loadCooperatives(): void {
    this.isLoading = true;
    const headers = this.getAuthHeaders();
    this.http.get<any>(`${this.API}/users?type=COOPERATIVE&size=100`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const content = res.content || res || [];
          this.cooperatives = content.map((u: any) => ({
            id: u.userId || u.id,
            name: u.name || u.cooperativeName || 'Unknown',
            region: u.region || 'N/A',
            type: u.cooperativeDetails?.cooperativeType || 'AGRICULTURAL',
            registrationNumber: u.registrationNumber || u.cooperativeDetails?.legalRegistrationNumber,
            contactPerson: u.cooperativeDetails?.contactPerson || u.name,
            totalMembers: u.cooperativeDetails?.totalMembers || 0,
            activeMemberCount: u.cooperativeDetails?.activeMemberCount || 0,
            status: u.status || 'ACTIVE',
            establishmentYear: u.cooperativeDetails?.establishmentYear,
            adminName: '',
            adminEmail: ''
          }));
          this.totalCooperatives = this.cooperatives.length;
          this.activeCooperatives = this.cooperatives.filter(c => c.status === 'ACTIVE').length;
          this.totalRegions = new Set(this.cooperatives.map(c => c.region)).size;
          this.applyFilters();
          this.isLoading = false;
        },
        error: () => {
          this.cooperatives = this.getMockCooperatives();
          this.totalCooperatives = this.cooperatives.length;
          this.activeCooperatives = this.cooperatives.filter(c => c.status === 'ACTIVE').length;
          this.totalRegions = new Set(this.cooperatives.map(c => c.region)).size;
          this.applyFilters();
          this.isLoading = false;
        }
      });
  }

  loadCoopAdmins(): void {
    const headers = this.getAuthHeaders();
    this.http.get<any>(`${this.API}/users?type=COOPERATIVE&size=100`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const content = res.content || res || [];
          this.coopAdmins = content.map((u: any) => ({
            userId: u.userId || u.id,
            name: u.name,
            email: u.email || 'N/A',
            phoneNumber: u.phoneNumber || 'N/A',
            status: u.status || 'ACTIVE',
            cooperativeId: u.cooperativeDetails?.cooperativeId,
            cooperativeName: u.name,
            region: u.region || 'N/A'
          }));
          this.totalAdmins = this.coopAdmins.length;
        },
        error: () => {
          this.coopAdmins = this.getMockAdmins();
          this.totalAdmins = this.coopAdmins.length;
        }
      });
  }

  // ── Filtering ──────────────────────────────────────────────────────────
  applyFilters(): void {
    this.filteredCooperatives = this.cooperatives.filter(c => {
      const matchSearch = !this.searchQuery ||
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (c.registrationNumber || '').toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchRegion = this.selectedRegion === 'All' || c.region === this.selectedRegion;
      const matchStatus = this.selectedStatus === 'All' || c.status === this.selectedStatus;
      return matchSearch && matchRegion && matchStatus;
    });
  }

  onSearchChange(): void { this.applyFilters(); }
  onFilterChange(): void { this.applyFilters(); }

  // ── Create Cooperative ─────────────────────────────────────────────────
  openCoopModal(): void {
    this.coopForm = {
      name: '', region: '', cooperativeType: 'AGRICULTURAL',
      legalRegistrationNumber: '', establishmentYear: new Date().getFullYear(),
      contactPerson: '', phoneNumber: ''
    };
    this.showCoopModal = true;
  }

  closeCoopModal(): void {
    this.showCoopModal = false;
    this.isSubmittingCoop = false;
  }

  submitCreateCooperative(): void {
    if (!this.coopForm.name || !this.coopForm.region || !this.coopForm.phoneNumber) {
      this.showError('Please fill in all required fields.');
      return;
    }
    this.isSubmittingCoop = true;
    const cmd = {
      type: 'COOPERATIVE',
      name: this.coopForm.name.trim(),
      phoneNumber: this.coopForm.phoneNumber.replace(/\s/g, ''),
      region: this.coopForm.region,
      cooperativeType: this.coopForm.cooperativeType,
      legalRegistrationNumber: this.coopForm.legalRegistrationNumber,
      establishmentYear: this.coopForm.establishmentYear,
      contactPerson: this.coopForm.contactPerson.trim() || this.coopForm.name.trim()
    };
    const headers = this.getAuthHeaders();
    this.http.post<any>(`${this.API}/users`, cmd, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.showSuccess(`Cooperative "${res.name || this.coopForm.name}" created successfully!`);
          this.closeCoopModal();
          this.loadCooperatives();
        },
        error: (err) => {
          this.showError(this.formatError(err));
          this.isSubmittingCoop = false;
        }
      });
  }

  // ── Create Cooperative Admin ───────────────────────────────────────────
  openAdminModal(coop?: Cooperative): void {
    this.adminForm = {
      name: '', email: '', phoneNumber: '',
      region: coop?.region || '',
      cooperativeId: coop?.id || ''
    };
      this.isSubmittingAdmin = false; 
    this.showAdminModal = true;
  }

  closeAdminModal(): void {
    this.showAdminModal = false;
    this.isSubmittingAdmin = false;
  }

  submitCreateAdmin(): void {
      console.log('submitCreateAdmin called');
    if (!this.adminForm.name || !this.adminForm.phoneNumber || !this.adminForm.cooperativeId) {
      this.showError('Please fill in all required fields: Name, Phone, and Cooperative.');
      return;
    }
    this.isSubmittingAdmin = true;
    const cmd = {
      type: 'COOPERATIVE',
      name: this.adminForm.name.trim(),
      email: this.adminForm.email?.trim() || undefined,
      phoneNumber: this.adminForm.phoneNumber.replace(/\s/g, ''),
      region: this.adminForm.region,
      cooperativeId: this.adminForm.cooperativeId
    };
    const headers = this.getAuthHeaders();
    this.http.post<any>(`${this.API}/users`, cmd, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.showSuccess(`Cooperative Admin "${res.name || this.adminForm.name}" created! Credentials sent.`);
          this.closeAdminModal();
          this.loadCoopAdmins();
          this.loadCooperatives();
        },
        error: (err) => {
          this.showError(this.formatError(err));
          this.isSubmittingAdmin = false;
        }
      });
  }

  // ── View Cooperative Modal ────────────────────────────────────────────
  openViewModal(coop: Cooperative): void {
    this.selectedCooperative = coop;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedCooperative = null;
  }

  // ── UI helpers ─────────────────────────────────────────────────────────
  switchTab(tab: 'cooperatives' | 'admins'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'status-active', INACTIVE: 'status-inactive',
      PENDING: 'status-pending', SUSPENDED: 'status-suspended'
    };
    return map[status] || 'status-active';
  }

  getCoopTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      AGRICULTURAL: 'Agricultural', LIVESTOCK: 'Livestock',
      FISHERY: 'Fishery', MIXED: 'Mixed'
    };
    return labels[type] || type;
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
  }

  formatError(err: any): string {
    return err?.error?.message || err?.message || 'An unexpected error occurred.';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken ? this.authService.getToken() : '';
    return new HttpHeaders({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  }

  // ── Mock data for UI demo when backend unavailable ─────────────────────
  private getMockCooperatives(): Cooperative[] {
    return [
      { id: 'c1', name: 'Coopérative du Centre', region: 'Centre', type: 'AGRICULTURAL', registrationNumber: 'CM-2020-001', contactPerson: 'Jean Mbarga', totalMembers: 145, activeMemberCount: 132, status: 'ACTIVE', establishmentYear: 2020 },
      { id: 'c2', name: 'Coop Littoral', region: 'Littoral', type: 'MIXED', registrationNumber: 'CM-2019-002', contactPerson: 'Marie Fotso', totalMembers: 98, activeMemberCount: 89, status: 'ACTIVE', establishmentYear: 2019 },
      { id: 'c3', name: 'Coop Ouest Agricole', region: 'Ouest', type: 'LIVESTOCK', registrationNumber: 'CM-2021-003', contactPerson: 'Paul Nkeng', totalMembers: 67, activeMemberCount: 60, status: 'INACTIVE', establishmentYear: 2021 },
    ];
  }

  private getMockAdmins(): CoopAdmin[] {
    return [
      { userId: 'a1', name: 'Jean Mbarga', email: 'mbarga@coop.cm', phoneNumber: '677001001', status: 'ACTIVE', cooperativeName: 'Coop du Centre', region: 'Centre' },
      { userId: 'a2', name: 'Marie Fotso', email: 'fotso@coop.cm', phoneNumber: '677002001', status: 'ACTIVE', cooperativeName: 'Coop Littoral', region: 'Littoral' },
    ];
  }
}