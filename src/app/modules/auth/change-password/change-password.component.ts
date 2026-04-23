// src/app/modules/auth/change-password/change-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isFirstLogin = false;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private authService: AuthService
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Check if this is first login
    this.isFirstLogin = this.authService.requiresFirstLoginPasswordChange();

    if (this.isFirstLogin) {
      // For first login, current password is not needed
      this.changePasswordForm.get('currentPassword')?.clearValidators();
      this.changePasswordForm.get('currentPassword')?.updateValueAndValidity();
    }

    // Ensure user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { mismatch: true };
  }

  get newPassword() {
    return this.changePasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.changePasswordForm.get('confirmPassword');
  }

  goToLogin() {
    this.authService.logout();
  }

  onSubmit() {
    this.errorMessage = '';

    // Mark all fields as touched to show validation errors
    if (this.changePasswordForm.invalid) {
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    const formValue = this.changePasswordForm.value;

    if (this.isFirstLogin) {
      // First login password change
      this.authService.setFirstLoginPassword(
        formValue.newPassword,
        formValue.confirmPassword
      ).subscribe({
        next: () => {
          console.log('✅ First login password set successfully');
          this.isLoading = false;
          alert('Password set successfully! Please login with your new password.');
          this.authService.logout();
        },
        error: (error) => {
          console.error('❌ Password change failed:', error);
          this.isLoading = false;
          this.errorMessage = this.getErrorMessage(error);
        }
      });
    } else {
      // Regular password change
      this.authService.changePassword({
        currentPassword: formValue.currentPassword,
        newPassword: formValue.newPassword,
        confirmPassword: formValue.confirmPassword
      }).subscribe({
        next: () => {
          console.log('✅ Password changed successfully');
          this.isLoading = false;
          alert('Password changed successfully! Please login with your new password.');
          this.authService.logout();
        },
        error: (error) => {
          console.error('❌ Password change failed:', error);
          this.isLoading = false;
          this.errorMessage = this.getErrorMessage(error);
        }
      });
    }
  }

  private getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (error.status === 400) {
      return 'Invalid password format or passwords do not match';
    }

    if (error.status === 401) {
      return 'Current password is incorrect';
    }

    return 'An error occurred while changing password. Please try again.';
  }
}