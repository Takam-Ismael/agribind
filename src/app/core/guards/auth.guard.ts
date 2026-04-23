// E:\INGE 4 ISI\Tutorial Project\agribind-platform\source-code\agribind-frontend\src\app\core\guards\auth.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    console.log('❌ User not authenticated, redirecting to login');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user needs to change password on first login
  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.firstLogin) {
    console.log('⚠️ First login detected, redirecting to password change');
    router.navigate(['/change-password']);
    return false;
  }

  console.log('✅ User authenticated');
  return true;
};