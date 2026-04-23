import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../core/services/user.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface Member {
  id: string;
  name: string;
  phone: string;
  type: string;
  region: string;
  primaryCrop: string;
  status: string;
  email?: string;
  joinDate?: string;
  farmSize?: string;
  address?: string;
  lastProduction?: string;
  creditStatus?: string;
  farmLocation?: string;
  registrationNumber?: string;
  gpsCoordinates?: string;
  department?: string;
  district?: string;
  village?: string;
  agriculturalType?: string;
  cropTypes?: string[];
  landArea?: number;
  farmerDetails?: any;
  preferredLanguage?: string;
  nativeLanguage?: string;       // ✅ NEW: Fulfulde | Ewondo | Duala | Bulu
}

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class MemberDetailComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  @Input() member: Member | null = null;

  isModalOpen = false;
  isLoading = false;
  fullMemberData: any = null;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    console.log('MemberDetailComponent initialized');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openModal(member: Member): void {
    console.log('Opening member detail modal for:', member);
    this.member = member;
    this.isModalOpen = true;
    this.isLoading = true;
    document.body.style.overflow = 'hidden';

    if (member.id) {
      this.userService.getUserById(member.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (userData: any) => {
            console.log('✅ Full user data loaded:', userData);
            this.fullMemberData = userData;
            this.isLoading = false;

            this.member = {
              ...this.member!,
              registrationNumber: userData.registrationNumber,
              email:              userData.email,
              gpsCoordinates:     userData.gpsCoordinates || userData.address?.gpsCoordinates,
              department:         userData.department  || userData.address?.department,
              district:           userData.district    || userData.address?.district,
              village:            userData.village     || userData.address?.village,
              address:            userData.fullAddress || userData.address?.getFullAddress?.() ||
                                  `${userData.village || ''}, ${userData.district || ''}, ${userData.department || ''}, ${userData.region || ''}`.trim(),
              farmLocation:       userData.gpsCoordinates || userData.address?.gpsCoordinates || 'Not specified',
              agriculturalType:   userData.farmerDetails?.agriculturalType,
              cropTypes:          userData.farmerDetails?.cropTypes || [],
              landArea:           userData.farmerDetails?.totalLandArea,
              farmSize:           userData.farmerDetails?.totalLandArea
                                    ? `${userData.farmerDetails.totalLandArea} ha`
                                    : undefined,
              joinDate:           userData.createdAt
                                    ? new Date(userData.createdAt).toLocaleDateString()
                                    : undefined,
              farmerDetails:      userData.farmerDetails,
              // ── Language fields ────────────────────────────────────────
              preferredLanguage:  userData.preferredLanguage
                                    || userData.profile?.preferredLanguage,
              nativeLanguage:     userData.nativeLanguage        // ✅ NEW
                                    || userData.profile?.nativeLanguage
                                    || undefined,
            };
          },
          error: (error) => {
            console.error('❌ Error loading full user data:', error);
            this.isLoading = false;
          }
        });
    } else {
      this.isLoading = false;
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.member = null;
    document.body.style.overflow = 'auto';
    this.modalClosed.emit();
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':   return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'pending':  return 'status-pending';
      default:         return 'status-active';
    }
  }

  getMemberTypeIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'farmer':      return '👨‍🌾';
      case 'cooperative': return '🏢';
      default:            return '👤';
    }
  }

  getCreditStatusClass(creditStatus: string | undefined): string {
    if (!creditStatus) return '';
    switch (creditStatus.toLowerCase()) {
      case 'good':
      case 'excellent': return 'credit-good';
      case 'fair':
      case 'average':   return 'credit-fair';
      case 'poor':
      case 'bad':       return 'credit-poor';
      default:          return '';
    }
  }

  hasAdditionalInfo(): boolean {
    if (!this.member) return false;
    return !!(
      this.member.farmSize     || this.member.landArea      ||
      this.member.lastProduction || this.member.creditStatus ||
      this.member.registrationNumber || this.member.gpsCoordinates
    );
  }

  /** Returns a formatted language string, e.g. "French + Ewondo" or just "French" */
  get languageSummary(): string {
    const official = this.member?.preferredLanguage ?? '';
    const native   = this.member?.nativeLanguage   ?? '';
    if (official && native) return `${official} + ${native}`;
    return official || 'Not specified';
  }
}