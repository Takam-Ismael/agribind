// src/app/modules/cooperative/members/member-form/member-form.component.ts
// ✅ COMPLETE VERSION — DUAL LANGUAGE SELECTION (official + native)

import { Component, EventEmitter, Output, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export interface NewMember {
  type: 'FARMER' | 'COOPERATIVE';
  name: string;
  email?: string;
  phoneNumber: string;
  region: string;
  department?: string;
  district?: string;
  village?: string;
  gpsCoordinates?: string;
  preferredLanguage: string;
  nativeLanguage?: string;       // Fulfulde | Ewondo | Duala | Bulu  (optional)
  notes?: string;
  agriculturalType?: string;
  cropTypes?: string[];
  landArea?: number;
  cooperativeType?: string;
  legalRegistrationNumber?: string;
  establishmentYear?: number;
  contactPerson?: string;
}

@Component({
  selector: 'app-member-form',
  templateUrl: './member-form.component.html',
  styleUrls: ['./member-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class MemberFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() memberAdded = new EventEmitter<NewMember>();
  @Output() modalClosed = new EventEmitter<void>();

  isModalOpen  = false;
  isSubmitting = false;
  memberForm!: FormGroup;

  // ── Google Maps ──────────────────────────────────────────────────────────
  private map: any = null;
  private marker: any = null;
  private autocomplete: any = null;
  private geocoder: any = null;
  mapInitialized = false;
  private initAttempts = 0;
  private maxInitAttempts = 10;

  userRole: string = 'COOPERATIVE';
  selectedMemberType: 'FARMER' | 'COOPERATIVE' = 'FARMER';

  // ── Static option lists ──────────────────────────────────────────────────
  regionOptions = [
    'ADAMAOUA', 'CENTRE', 'EST', 'EXTREME_NORD', 'LITTORAL',
    'NORD', 'NORD_OUEST', 'OUEST', 'SUD', 'SUD_OUEST'
  ];
  agriculturalTypeOptions = ['CROP', 'LIVESTOCK', 'MIXED'];
  cropOptions = [
    'COCOA', 'COFFEE', 'MAIZE', 'CASSAVA', 'RICE', 'COTTON',
    'PALM_OIL', 'PLANTAINS', 'BANANAS', 'BEANS'
  ];
  cooperativeTypeOptions = ['PRODUCTION', 'MARKETING', 'CREDIT', 'CONSUMER', 'MULTIPURPOSE'];

  /**
   * Native languages supported by the backend.
   * Keep this list in sync with the backend Language enum / normalizeLanguage().
   * Supported: Fulfulde, Ewondo, Duala, Bulu
   */
  readonly nativeLanguageOptions: string[] = ['Fulfulde', 'Ewondo', 'Duala', 'Bulu'];

  constructor(private fb: FormBuilder, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.initForm();
    this.loadGoogleMapsScript();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.cleanupGoogleMaps();
  }

  // ── Form setup ────────────────────────────────────────────────────────────

  private initForm(): void {
    this.memberForm = this.fb.group({
      type:              ['FARMER', Validators.required],
      name:              ['', [Validators.required, Validators.minLength(2)]],
      email:             ['', [Validators.email]],
      phoneNumber:       ['', [Validators.required, Validators.pattern(/^\+237\s?[6-9]\d{8}$/)]],
      region:            ['', Validators.required],
      department:        [''],
      district:          [''],
      village:           [''],

      // ── Language (2 fields) ──────────────────────────────────────────────
      preferredLanguage: ['French', Validators.required],  // French | English
      nativeLanguage:    [''],                              // Fulfulde | Ewondo | Duala | Bulu (optional)

      // ── Farm location ────────────────────────────────────────────────────
      farmLocationSearch:  [''],
      farmGpsCoordinates:  ['', [Validators.required, this.gpsCoordinatesValidator]],
      farmFullAddress:     [''],

      // ── Farmer fields ────────────────────────────────────────────────────
      agriculturalType:  [''],
      cropTypes:         [[]],
      landArea:          [null, [Validators.min(0.1)]],

      // ── Cooperative fields ───────────────────────────────────────────────
      cooperativeType:          [''],
      legalRegistrationNumber:  [''],
      establishmentYear:        [null, [Validators.min(1900), Validators.max(new Date().getFullYear())]],
      contactPerson:            ['']
    });

    this.memberForm.get('type')?.valueChanges.subscribe(type => {
      this.selectedMemberType = type;
      this.updateValidators();
    });

    this.updateValidators();
  }

  private updateValidators(): void {
    const controls = {
      farmGps:       this.memberForm.get('farmGpsCoordinates'),
      agricType:     this.memberForm.get('agriculturalType'),
      landArea:      this.memberForm.get('landArea'),
      coopType:      this.memberForm.get('cooperativeType'),
      legalReg:      this.memberForm.get('legalRegistrationNumber'),
      contactPerson: this.memberForm.get('contactPerson'),
    };

    Object.values(controls).forEach(c => c?.clearValidators());

    if (this.selectedMemberType === 'FARMER') {
      controls.farmGps?.setValidators([Validators.required, this.gpsCoordinatesValidator]);
      controls.agricType?.setValidators([Validators.required]);
      controls.landArea?.setValidators([Validators.required, Validators.min(0.1)]);
    } else {
      controls.coopType?.setValidators([Validators.required]);
      controls.legalReg?.setValidators([Validators.required]);
      controls.contactPerson?.setValidators([Validators.required]);
    }

    Object.values(controls).forEach(c => c?.updateValueAndValidity({ emitEvent: false }));
  }

  // ── GPS validator ─────────────────────────────────────────────────────────

  private gpsCoordinatesValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    if (!/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(control.value)) return { invalidFormat: true };
    const [lat, lng] = control.value.split(',').map((s: string) => parseFloat(s.trim()));
    if (isNaN(lat) || isNaN(lng))             return { invalidNumbers: true };
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { outOfRange: true };
    return null;
  }

  // ── Language helpers ──────────────────────────────────────────────────────

  /**
   * Toggle native language selection.
   * Clicking the already-selected language deselects it.
   */
  selectNativeLanguage(lang: string): void {
    const current = this.memberForm.get('nativeLanguage')?.value;
    this.memberForm.patchValue(
      { nativeLanguage: current === lang ? '' : lang },
      { emitEvent: false }
    );
  }

  isNativeLanguageSelected(lang: string): boolean {
    return this.memberForm.get('nativeLanguage')?.value === lang;
  }

  /**
   * Human-readable summary shown below the language pickers.
   * e.g. "French + Ewondo" or just "French"
   */
  get languageSummary(): string {
    const official = this.memberForm.get('preferredLanguage')?.value ?? '';
    const native   = this.memberForm.get('nativeLanguage')?.value   ?? '';
    if (official && native) return `${official} + ${native}`;
    return official;
  }

  // ── Google Maps ───────────────────────────────────────────────────────────

  private loadGoogleMapsScript(): void {
    if (window.google?.maps) return;
    if (document.querySelector('script[src*="maps.googleapis.com"]')) return;

    const script  = document.createElement('script');
    const apiKey  = environment.googleMapsApiKey || 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';

    window.initMap = () => {
      this.geocoder = new window.google.maps.Geocoder();
    };

    script.src   = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => console.error('❌ Failed to load Google Maps');
    document.head.appendChild(script);
  }

  private async initMapInstance(): Promise<void> {
    if (!window.google?.maps) {
      if (this.initAttempts < this.maxInitAttempts) {
        this.initAttempts++;
        setTimeout(() => this.initMapInstance(), 500);
      }
      return;
    }

    const mapContainer = document.getElementById('farm-map-container');
    if (!mapContainer) {
      if (this.initAttempts < this.maxInitAttempts) {
        this.initAttempts++;
        setTimeout(() => this.initMapInstance(), 300);
      }
      return;
    }

    this.ngZone.run(() => {
      try {
        const cameroonCenter = { lat: 5.9631, lng: 10.1591 };
        this.map = new window.google.maps.Map(mapContainer, {
          center: cameroonCenter, zoom: 6,
          mapTypeControl: true, streetViewControl: false, fullscreenControl: true,
        });
        this.marker = new window.google.maps.Marker({
          map: this.map, draggable: true,
          animation: window.google.maps.Animation.DROP,
          title: 'Farm Location', visible: false
        });
        this.map.addListener('click', (e: any) =>
          this.ngZone.run(() => this.placeFarmMarker(e.latLng)));
        this.marker.addListener('dragend', () =>
          this.ngZone.run(() => this.updateFarmCoordinatesFromMarker()));
        this.mapInitialized = true;
        this.initFarmLocationAutocomplete();
      } catch (err) {
        console.error('❌ Error creating map:', err);
      }
    });
  }

  private initFarmLocationAutocomplete(): void {
    const input = document.getElementById('farm-location-search') as HTMLInputElement;
    if (!input || !window.google?.maps) return;
    try {
      this.autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'cm' },
        fields: ['geometry', 'formatted_address', 'name']
      });
      this.autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = this.autocomplete.getPlace();
          if (!place.geometry?.location) return;
          this.map.setCenter(place.geometry.location);
          this.map.setZoom(15);
          this.placeFarmMarker(place.geometry.location);
          this.memberForm.patchValue(
            { farmFullAddress: place.formatted_address || place.name },
            { emitEvent: false }
          );
        });
      });
    } catch (err) {
      console.error('❌ Autocomplete error:', err);
    }
  }

  private placeFarmMarker(location: any): void {
    if (!this.marker || !this.map) return;
    this.marker.setPosition(location);
    this.marker.setVisible(true);
    this.map.panTo(location);
    this.updateFarmCoordinatesFromMarker();
  }

  private updateFarmCoordinatesFromMarker(): void {
    const pos = this.marker?.getPosition();
    if (pos) {
      this.memberForm.patchValue(
        { farmGpsCoordinates: `${pos.lat().toFixed(6)}, ${pos.lng().toFixed(6)}` },
        { emitEvent: false }
      );
    }
  }

  clearFarmLocation(): void {
    this.memberForm.patchValue(
      { farmLocationSearch: '', farmGpsCoordinates: '', farmFullAddress: '' },
      { emitEvent: false }
    );
    this.marker?.setVisible(false);
    this.map?.setCenter({ lat: 5.9631, lng: 10.1591 });
    this.map?.setZoom(6);
  }

  private cleanupGoogleMaps(): void {
    if (this.map && window.google)
      window.google.maps.event.clearInstanceListeners(this.map);
    if (this.autocomplete && window.google)
      window.google.maps.event.clearInstanceListeners(this.autocomplete);
    this.marker?.setMap(null);
    this.map = null; this.marker = null; this.autocomplete = null;
    this.mapInitialized = false; this.initAttempts = 0;
  }

  // ── Modal management ──────────────────────────────────────────────────────

  openModal(): void {
    this.isModalOpen = true;
    this.selectedMemberType = 'FARMER';
    this.memberForm.reset({
      type: 'FARMER',
      phoneNumber: '+237 ',
      preferredLanguage: 'French',
      nativeLanguage: '',
      agriculturalType: '',
      cropTypes: []
    });
    document.body.style.overflow = 'hidden';
    this.initAttempts = 0;
    setTimeout(() => { if (this.isModalOpen) this.initMapInstance(); }, 500);
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubmitting = false;
    this.memberForm.reset();
    this.cleanupGoogleMaps();
    document.body.style.overflow = 'auto';
    this.modalClosed.emit();
  }

  // ── Submission ────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.memberForm.valid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const v = this.memberForm.value;

    console.log('🔍 Full form value:', v);
  console.log('🔍 nativeLanguage from form:', v.nativeLanguage);
  console.log('🔍 preferredLanguage from form:', v.preferredLanguage);

    const newMember: NewMember = {
      type:              v.type,
      name:              v.name.trim(),
      email:             v.email?.trim()        || undefined,
      phoneNumber:       v.phoneNumber.replace(/\s/g, ''),
      region:            v.region,
      department:        v.department?.trim()   || undefined,
      district:          v.district?.trim()     || undefined,
      village:           v.village?.trim()      || undefined,
      preferredLanguage: v.preferredLanguage,
      nativeLanguage:    v.nativeLanguage?.trim() || undefined,
    };

    if (v.type === 'FARMER') {
      newMember.agriculturalType = v.agriculturalType;
      newMember.cropTypes        = v.cropTypes || [];
      newMember.landArea         = v.landArea;
      if (v.farmGpsCoordinates)
        newMember.gpsCoordinates = v.farmGpsCoordinates.trim();
      if (v.farmLocationSearch)
        newMember.notes = `Farm Location: ${v.farmLocationSearch.trim()}`;
    } else {
      newMember.cooperativeType          = v.cooperativeType;
      newMember.legalRegistrationNumber  = v.legalRegistrationNumber;
      newMember.establishmentYear        = v.establishmentYear;
      newMember.contactPerson            = v.contactPerson;
    }

    this.memberAdded.emit(newMember);
    setTimeout(() => this.closeModal(), 1000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  isFieldInvalid(field: string): boolean {
    const c = this.memberForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  toggleCrop(crop: string): void {
    const crops: string[] = this.memberForm.get('cropTypes')?.value || [];
    const idx = crops.indexOf(crop);
    idx > -1 ? crops.splice(idx, 1) : crops.push(crop);
    this.memberForm.patchValue({ cropTypes: crops }, { emitEvent: false });
  }

  isCropSelected(crop: string): boolean {
    return (this.memberForm.get('cropTypes')?.value || []).includes(crop);
  }

  canAddCooperative(): boolean {
    return this.userRole === 'ADMIN';
  }
}