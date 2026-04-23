import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  registrationNumber?: string;
  gpsCoordinates?: string;
  department?: string;
  district?: string;
  village?: string;
  agriculturalType?: string;
  cropTypes?: string[];
  landArea?: number;
  farmLocation?: string;
}

@Component({
  selector: 'app-edit-member-form',
  templateUrl: './edit-member-form.component.html',
  styleUrls: ['./edit-member-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class EditMemberFormComponent implements OnInit, OnDestroy {
  @Output() memberUpdated = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  isModalOpen = false;
  isSubmitting = false;
  isLoading = false;
  memberForm!: FormGroup;
  currentMember: Member | null = null;
  fullUserData: any = null;
  private destroy$ = new Subject<void>();

  // Options
  regionOptions = ['ADAMAOUA', 'CENTRE', 'EST', 'EXTREME_NORD', 'LITTORAL',
                   'NORD', 'NORD_OUEST', 'OUEST', 'SUD', 'SUD_OUEST'];
  agriculturalTypeOptions = ['CROP', 'LIVESTOCK', 'MIXED'];
  cropTypeOptions = ['COCOA', 'COFFEE', 'CASSAVA', 'MAIZE', 'RICE', 'COTTON', 'PALM_OIL', 'BANANA', 'PLANTAIN'];

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.memberForm = this.fb.group({
      id: [{ value: '', disabled: true }],
      name: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+237\s?[6-9]\d{8}$/)]],
      type: ['', Validators.required],
      region: ['', Validators.required],
      department: [''],
      district: [''],
      village: [''],
      email: ['', [Validators.email]],
      status: ['ACTIVE', Validators.required],
      
      // Farmer-specific fields
      agriculturalType: [''],
      cropTypes: [[]],
      landArea: [null, [Validators.min(0.1)]],
      gpsCoordinates: [''],
      farmLocation: ['']
    });
  }

  openModal(member: Member): void {
    console.log('Opening edit modal for member:', member);
    this.currentMember = member;
    this.isModalOpen = true;
    this.isLoading = true;
    document.body.style.overflow = 'hidden';

    // Fetch full user data from backend
    if (member.id) {
      this.userService.getUserById(member.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (userData: any) => {
            console.log('✅ Full user data loaded for edit:', userData);
            this.fullUserData = userData;
            this.isLoading = false;

            // Populate form with full user data
            this.memberForm.patchValue({
              id: userData.userId || userData.id,
              name: userData.name,
              phoneNumber: userData.phoneNumber,
              type: userData.type,
              region: userData.region || userData.address?.region,
              department: userData.department || userData.address?.department || '',
              district: userData.district || userData.address?.district || '',
              village: userData.village || userData.address?.village || '',
              email: userData.email || '',
              status: userData.status || 'ACTIVE',
              agriculturalType: userData.farmerDetails?.agriculturalType || '',
              cropTypes: userData.farmerDetails?.cropTypes || [],
              landArea: userData.farmerDetails?.totalLandArea || null,
              gpsCoordinates: userData.gpsCoordinates || userData.address?.gpsCoordinates || '',
              farmLocation: userData.gpsCoordinates || userData.address?.gpsCoordinates || ''
            });
          },
          error: (error) => {
            console.error('❌ Error loading full user data:', error);
            this.isLoading = false;
            // Fallback to basic member data
            this.memberForm.patchValue({
              id: member.id,
              name: member.name,
              phoneNumber: member.phone,
              type: member.type,
              region: member.region,
              status: member.status
            });
          }
        });
    } else {
      this.isLoading = false;
      // Fallback to basic member data
      this.memberForm.patchValue({
        id: member.id,
        name: member.name,
        phoneNumber: member.phone,
        type: member.type,
        region: member.region,
        status: member.status
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubmitting = false;
    this.currentMember = null;
    this.memberForm.reset();
    document.body.style.overflow = 'auto';
    this.modalClosed.emit();
  }

  onSubmit(): void {
    if (this.memberForm.valid && this.currentMember) {
      this.isSubmitting = true;

      const formData = this.memberForm.getRawValue();
      const updateCommand: any = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.replace(/\s/g, ''),
        email: formData.email?.trim() || null,
        region: formData.region, // String will be converted to enum by Spring
        department: formData.department?.trim() || null,
        district: formData.district?.trim() || null,
        village: formData.village?.trim() || null,
        gpsCoordinates: formData.gpsCoordinates?.trim() || null,
        status: formData.status
      };

      // Add farmer-specific fields if type is FARMER
      if (formData.type === 'FARMER') {
        updateCommand.agriculturalType = formData.agriculturalType || null;
        updateCommand.cropTypes = formData.cropTypes || [];
        updateCommand.landArea = formData.landArea || null;
      }

      console.log('🚀 Updating user with command:', updateCommand);

      // Call backend update API
      this.userService.updateUser(formData.id, updateCommand)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedUser: any) => {
            console.log('✅ Member updated successfully:', updatedUser);
            this.memberUpdated.emit(updatedUser);
            this.closeModal();
          },
          error: (error) => {
            console.error('❌ Error updating member:', error);
            alert('Failed to update member. Please try again.');
            this.isSubmitting = false;
          }
        });
    } else {
      this.memberForm.markAllAsTouched();
      console.log('❌ Form is invalid');
    }
  }

  toggleCrop(crop: string): void {
    const cropTypes = this.memberForm.get('cropTypes')?.value || [];
    const index = cropTypes.indexOf(crop);

    if (index > -1) {
      cropTypes.splice(index, 1);
    } else {
      cropTypes.push(crop);
    }

    this.memberForm.patchValue({ cropTypes }, { emitEvent: false });
  }

  isCropSelected(crop: string): boolean {
    const cropTypes = this.memberForm.get('cropTypes')?.value || [];
    return cropTypes.includes(crop);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.memberForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
