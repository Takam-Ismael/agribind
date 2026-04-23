// src/app/modules/cooperative/members/member-list/member-list.component.ts

import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Services
import { UserService, CreateUserCommand } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { QrCodeService, QRCodeResponse } from '../../../../core/services/qr-code.service';
import { ExportService } from '../../../../core/services/export.service';
import { HttpClient } from '@angular/common/http';

// Components
import { MemberFormComponent } from '../member-form/member-form.component';
import { EditMemberFormComponent } from '../edit-member-form/edit-member-form.component';
import { MemberDetailComponent } from '../member-detail/member-detail.component';
import { DeleteMemberComponent } from '../delete-member/delete-member.component';

interface Member {
  id: string;
  name: string;
  phone: string;
  type: string;
  region: string;
  gpsCoordinates?: string;
  primaryCrop: string;
  status: string;
  email?: string;
  registrationNumber?: string;
  preferredLanguage?: string; 
}

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MemberFormComponent,
    EditMemberFormComponent,
    MemberDetailComponent,
    DeleteMemberComponent
  ],
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent implements OnInit, OnDestroy {
  @ViewChild(MemberFormComponent) memberFormComponent!: MemberFormComponent;
  @ViewChild(EditMemberFormComponent) editMemberFormComponent!: EditMemberFormComponent;
  @ViewChild(MemberDetailComponent) memberDetailComponent!: MemberDetailComponent;
  @ViewChild(DeleteMemberComponent) deleteMemberComponent!: DeleteMemberComponent;

  private destroy$ = new Subject<void>();

  members: Member[] = [];
  filteredMembers: Member[] = [];
  paginatedMembers: Member[] = [];
  isLoading = false;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Search and Filters
  searchQuery = '';
  selectedStatus = 'All';
  selectedRegion = 'All';
  selectedCrop = 'All';

  // Filter options
  statusOptions = ['All', 'ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'];
  regionOptions = ['All', 'ADAMAOUA', 'CENTRE', 'EST', 'EXTREME_NORD', 'LITTORAL',
                   'NORD', 'NORD_OUEST', 'OUEST', 'SUD', 'SUD_OUEST'];
  cropOptions = ['All', 'COCOA', 'COFFEE', 'CASSAVA', 'MAIZE', 'RICE', 'COTTON', 'PALM_OIL'];

  // Tab System
  activeTab: 'farmers' | 'managers' = 'farmers';
  isCooperativeAdmin = false;
  managersCount = 0;

  // User info
  user: any = {
    name: 'Cooperative Manager',
    role: 'Cooperative',
    initials: 'CM',
    email: ''
  };

  // QR Code modal
  showQRModal = false;
  selectedQRCode: QRCodeResponse | null = null;
  qrCodeLoading = false;
  currentQRMember: Member | null = null;
  qrSecondsLeft = 300;
  private qrCountdownInterval: any;

  // Export
  exportLoading = false;

  // Create Manager Modal
  showManagerModal = false;
  isSubmittingManager = false;
  managerForm = { name: '', phone: '', email: '', region: '' };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private qrCodeService: QrCodeService,
    private exportService: ExportService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUserInfo();
    const currentUser = this.authService.getCurrentUser();
    this.isCooperativeAdmin = currentUser?.role === 'COOPERATIVE';
    this.loadMembers();
    if (this.isCooperativeAdmin) { this.loadManagersCount(); }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.qrCountdownInterval);
  }

  // ── Tab System ───────────────────────────────────────────────────────

  switchTab(tab: 'farmers' | 'managers'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchQuery = '';
    this.selectedStatus = 'All';
    this.selectedRegion = 'All';
    this.loadMembers();
  }

  // ── Manager count ────────────────────────────────────────────────────

  loadManagersCount(): void {
    this.userService.getUsers(0, 1, { type: 'COOPERATIVE_MANAGER' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (r: any) => { this.managersCount = r.totalElements ?? 0; }, error: () => {} });
  }

  // ── Manager Modal ────────────────────────────────────────────────────

  openAddManagerModal(): void {
    this.managerForm = { name: '', phone: '+237 ', email: '', region: '' };
    this.showManagerModal = true;
  }

  closeManagerModal(): void {
    this.showManagerModal = false;
    this.isSubmittingManager = false;
  }

  submitCreateManager(): void {
    if (!this.managerForm.name || !this.managerForm.phone || !this.managerForm.region) {
      alert('Please fill in all required fields (Name, Phone, Region).');
      return;
    }
    this.isSubmittingManager = true;
    const cmd: CreateUserCommand = {
      type: 'COOPERATIVE_MANAGER' as any,
      name: this.managerForm.name.trim(),
      email: this.managerForm.email?.trim() || undefined,
      phoneNumber: this.managerForm.phone.replace(/\s/g, ''),
      region: this.managerForm.region as any,
      preferredLanguage: 'French'
    };
    this.userService.createUser(cmd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          alert(`✅ Manager "${user.name}" created successfully! Credentials sent.`);
          this.closeManagerModal();
          this.loadManagersCount();
          if (this.activeTab === 'managers') { this.loadMembers(); }
          this.isSubmittingManager = false;
        },
        error: (err: any) => {
          alert('❌ ' + this.formatErrorMessage(err));
          this.isSubmittingManager = false;
        }
      });
  }

  // ── User info ────────────────────────────────────────────────────────

  loadUserInfo() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = {
        name: currentUser.username || currentUser.email || 'User',
        role: this.formatRole(currentUser.role),
        initials: this.getInitials(currentUser.username || currentUser.email || 'User'),
        email: currentUser.email || ''
      };
    }
  }

  // ── Members loading ──────────────────────────────────────────────────

  loadMembers() {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: any = {};

    if (this.activeTab === 'managers') {
      filters.type = 'COOPERATIVE_MANAGER';
    } else {
      filters.type = 'FARMER';
    }

    if (this.selectedStatus !== 'All') filters.status = this.selectedStatus;
    if (this.selectedRegion !== 'All') filters.region = this.selectedRegion;
    if (this.searchQuery.trim()) filters.searchTerm = this.searchQuery.trim();

    this.userService.getUsers(this.currentPage - 1, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.members = (response.content || []).map((user: any) => this.transformUserToMember(user));
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.isLoading = false;
          this.applyLocalFilters();
        },
        error: (error) => {
          console.error('Error loading members:', error);
          this.errorMessage = 'Failed to load members. Please check your connection.';
          this.isLoading = false;
        }
      });
  }

  // ── QR CODE ──────────────────────────────────────────────────────────

  generateAccountAccessQR(member: Member) {
    this.currentQRMember = member;
    this.qrCodeLoading = true;
    this.showQRModal = true;
    this.selectedQRCode = null;
    clearInterval(this.qrCountdownInterval);

    this.qrCodeService.generateLoginQRCode(member.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ QR generated for:', member.name);
          this.selectedQRCode = response;
          this.qrCodeLoading = false;
          this.startQRCountdown();
        },
        error: (error) => {
          console.error('❌ QR generation failed:', error);
          this.errorMessage = 'Failed to generate QR code. Check backend connection.';
          this.qrCodeLoading = false;
        }
      });
  }

  startQRCountdown() {
    clearInterval(this.qrCountdownInterval);
    this.qrSecondsLeft = 300;
    this.qrCountdownInterval = setInterval(() => {
      this.qrSecondsLeft--;
      if (this.qrSecondsLeft <= 0) {
        clearInterval(this.qrCountdownInterval);
        this.selectedQRCode = null; // triggers "expired" state in template
      }
    }, 1000);
  }

  formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getSafeQRCodeUrl(): string | null {
    const img = this.selectedQRCode?.qrCodeImage;
    if (!img) return null;
    if (img.startsWith('data:image')) return img;
    return 'data:image/png;base64,' + img;
  }

  downloadQRCode() {
    if (!this.selectedQRCode) return;

    this.qrCodeService.downloadQRCode(this.selectedQRCode.userId, 'LOGIN')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const filename = `qrcode_${this.currentQRMember?.name || this.selectedQRCode!.userId}.png`;
          this.qrCodeService.triggerDownload(blob, filename);
        },
        error: (error) => {
          console.error('❌ Download failed:', error);
          // Fallback: download from base64 image directly
          const url = this.getSafeQRCodeUrl();
          if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.download = `qrcode_${this.currentQRMember?.name || 'farmer'}.png`;
            link.click();
          }
        }
      });
  }

  closeQRModal() {
    this.showQRModal = false;
    this.selectedQRCode = null;
    this.qrCodeLoading = false;
    this.currentQRMember = null;
    clearInterval(this.qrCountdownInterval);
  }

  // ── Export ───────────────────────────────────────────────────────────

  onExport() {
    this.exportLoading = true;
    try {
      const headers = ['AR Code', 'Registration Number', 'Name', 'Phone', 'Type',
                       'Region', 'Farm Location', 'Primary Crop', 'Status', 'Email'];
      const csvData = this.filteredMembers.map(member => [
        member.id, member.registrationNumber || 'N/A', member.name, member.phone,
        member.type, member.region, member.gpsCoordinates || 'Not set',
        member.primaryCrop, member.status, member.email || 'N/A'
      ]);
      const timestamp = new Date().toISOString().split('T')[0];
      this.createCSVFile([headers, ...csvData], `members_export_${timestamp}.csv`);
      this.exportLoading = false;
      alert(`✅ CSV export completed! Downloaded ${csvData.length} records.`);
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      this.exportLoading = false;
      alert('Failed to generate CSV export. Please try again.');
    }
  }

  private createCSVFile(data: any[][], filename: string) {
    const csvContent = data.map(row =>
      row.map(cell => {
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.exportService.triggerDownload(blob, filename);
  }

  // ── Member events ────────────────────────────────────────────────────

  onMemberAdded(newMember: any) {
    console.log('🔍 Received in list:', newMember.nativeLanguage);
    const createCommand: any = {
      type: newMember.type,
      name: newMember.name,
      email: newMember.email || null,
      phoneNumber: newMember.phoneNumber,
      region: newMember.region || null,
      department: newMember.department || null,
      district: newMember.district || null,
      village: newMember.village || null,
      gpsCoordinates: newMember.gpsCoordinates || null,
      preferredLanguage: newMember.preferredLanguage || 'French',
      nativeLanguage: newMember.nativeLanguage || null,
    };

    if (newMember.type === 'FARMER') {
      createCommand.agriculturalType = newMember.agriculturalType || null;
      createCommand.cropTypes = newMember.cropTypes || [];
      createCommand.livestockTypes = newMember.livestockTypes || [];
      createCommand.landArea = newMember.landArea || null;
      createCommand.cooperativeId = newMember.cooperativeId || null;
    }

    if (newMember.type === 'COOPERATIVE') {
      createCommand.cooperativeType = newMember.cooperativeType || null;
      createCommand.legalRegistrationNumber = newMember.legalRegistrationNumber || null;
      createCommand.establishmentYear = newMember.establishmentYear || null;
      createCommand.contactPerson = newMember.contactPerson || null;
    }

    this.isLoading = true;
    this.userService.createUser(createCommand)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          alert(`✅ ${user.name} registered successfully!`);
          this.loadMembers();
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = this.formatErrorMessage(error);
          this.isLoading = false;
          alert('❌ ' + this.errorMessage);
        }
      });
  }

  onMemberUpdated(updatedMember: any) {
    this.loadMembers();
    this.showSuccessMessage('Member updated successfully!');
  }

  onMemberDeleted(member: Member) {
    this.userService.deleteUser(member.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadMembers();
          this.showSuccessMessage('Member deleted successfully!');
        },
        error: () => this.showErrorMessage('Failed to delete member')
      });
  }

  onModalClosed() {}

  // ── Modal openers ────────────────────────────────────────────────────

  openAddMemberModal() {
    if (this.memberFormComponent) this.memberFormComponent.openModal();
  }

  openEditMemberModal(member: Member) {
    if (this.editMemberFormComponent) this.editMemberFormComponent.openModal(member);
  }

  openViewMemberModal(member: Member) {
    if (this.memberDetailComponent) this.memberDetailComponent.openModal(member);
  }

  openDeleteConfirmModal(member: Member) {
    if (this.deleteMemberComponent) this.deleteMemberComponent.openModal(member);
  }

  // ── Pagination ───────────────────────────────────────────────────────

  previousPage() {
    if (this.currentPage > 1) { this.currentPage--; this.loadMembers(); }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.loadMembers(); }
  }

  onStatusChange() { this.currentPage = 1; this.loadMembers(); }
  onRegionChange() { this.currentPage = 1; this.loadMembers(); }
  onCropChange()   { this.currentPage = 1; this.applyLocalFilters(); }
  onSearchChange() { this.currentPage = 1; this.loadMembers(); }

  // ── Filters ──────────────────────────────────────────────────────────

  applyLocalFilters() {
    this.filteredMembers = this.members.filter(member => {
      const matchesStatus = this.selectedStatus === 'All' || member.status === this.selectedStatus;
      const matchesRegion = this.selectedRegion === 'All' || member.region === this.selectedRegion;
      const matchesCrop   = this.selectedCrop === 'All' ||
        this.formatCropName(this.selectedCrop) === member.primaryCrop;
      const matchesSearch = !this.searchQuery.trim() ||
        member.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        member.phone.includes(this.searchQuery) ||
        (member.registrationNumber && member.registrationNumber.includes(this.searchQuery));
      return matchesStatus && matchesRegion && matchesCrop && matchesSearch;
    });
    this.updatePaginatedMembers();
  }

  updatePaginatedMembers() {
    this.paginatedMembers = this.filteredMembers;
  }

  // ── Transforms ───────────────────────────────────────────────────────

  transformUserToMember(user: any): Member {
    const region = user.region || (user.address && user.address.region);
    const gpsCoordinates = user.gpsCoordinates || (user.address && user.address.gpsCoordinates);
    return {
      id: user.userId || user.id,
      name: user.name,
      phone: user.phoneNumber,
      type: this.formatUserType(user.type),
      region: this.formatRegionName(region),
      gpsCoordinates,
      primaryCrop: this.getPrimaryCrop(user),
      status: this.formatStatus(user.status),
      email: user.email,
      preferredLanguage: user.preferredLanguage, 
      registrationNumber: user.registrationNumber
    };
  }

  getPrimaryCrop(user: any): string {
    if (user.farmerDetails?.cropTypes?.length > 0) {
      return this.formatCropName(user.farmerDetails.cropTypes[0]);
    }
    if (user.cooperativeDetails) return 'Mixed';
    return 'N/A';
  }

  // ── Stats ────────────────────────────────────────────────────────────

  getTotalMembers()        { return this.totalElements; }
  getFarmersCount()        { return this.members.filter(m => m.type === 'Farmer').length; }
  getFarmersPercentage()   { return this.totalElements === 0 ? 0 : Math.round((this.getFarmersCount() / this.totalElements) * 100); }
  getCooperativesCount()   { return this.members.filter(m => m.type === 'Cooperative').length; }
  getCooperativesPercentage() { return this.totalElements === 0 ? 0 : Math.round((this.getCooperativesCount() / this.totalElements) * 100); }
  getActiveMembers()       { return this.members.filter(m => m.status === 'Active').length; }
  getActivePercentage()    { return this.totalElements === 0 ? 0 : Math.round((this.getActiveMembers() / this.totalElements) * 100); }

  // ── Formatters ───────────────────────────────────────────────────────

  formatCropName(crop: string): string {
    const map: { [k: string]: string } = {
      COCOA: 'Cocoa', COFFEE: 'Coffee', MAIZE: 'Maize',
      CASSAVA: 'Cassava', RICE: 'Rice', COTTON: 'Cotton', PALM_OIL: 'Palm Oil'
    };
    return map[crop] || crop;
  }

  formatRegionName(region: string): string {
    if (!region) return 'N/A';
    const map: { [k: string]: string } = {
      ADAMAOUA: 'Adamaoua', CENTRE: 'Centre', EST: 'East',
      EXTREME_NORD: 'Far North', LITTORAL: 'Littoral', NORD: 'North',
      NORD_OUEST: 'Northwest', OUEST: 'West', SUD: 'South', SUD_OUEST: 'Southwest'
    };
    return map[region] || region;
  }

  formatUserType(type: string): string {
    const map: { [k: string]: string } = {
      FARMER: 'Farmer', COOPERATIVE: 'Cooperative',
      COOPERATIVE_MANAGER: 'Cooperative Manager', GOVERNMENT: 'Government'
    };
    return map[type] || type;
  }

  formatStatus(status: string): string {
    const map: { [k: string]: string } = {
      ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Pending', SUSPENDED: 'Suspended'
    };
    return map[status] || status;
  }

  formatRole(role: string): string {
    const map: { [k: string]: string } = {
      COOPERATIVE: 'Cooperative Manager', FARMER: 'Farmer', GOVERNMENT: 'Government Official'
    };
    return map[role] || role;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  getTypeClass(type: string): string {
    return type === 'Farmer' ? 'type-farmer' : 'type-cooperative';
  }

  getStatusClass(status: string): string {
    const map: { [k: string]: string } = {
      Active: 'status-active', Inactive: 'status-inactive',
      Pending: 'status-pending', Suspended: 'status-suspended'
    };
    return map[status] || 'status-active';
  }

  private formatErrorMessage(error: any): string {
    if (error.error?.message) return error.error.message;
    const map: { [k: number]: string } = {
      0:   'Cannot connect to server. Please check your internet connection.',
      400: 'Invalid data provided. Please check all required fields.',
      401: 'Your session has expired. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'Resource not found.',
      409: 'Phone number or email already exists.',
      500: 'Server error. Please try again later.'
    };
    return map[error.status] || 'An unexpected error occurred. Please try again.';
  }

  showSuccessMessage(message: string) { alert(message); }
  showErrorMessage(message: string)   { alert('Error: ' + message); }
}