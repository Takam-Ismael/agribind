// E:\INGE 4 ISI\Tutorial Project\agribind-platform\source-code\agribind-frontend\src\app\core\guards\role.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    console.log('❌ No user logged in, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  // Get expected roles from route data
  const expectedRoles = route.data['roles'] as string[];
  const userRole = authService.getUserRole();

  if (!userRole) {
    console.log('❌ No user role found, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  // Check if user has required role
  if (expectedRoles && expectedRoles.includes(userRole.toUpperCase())) {
    console.log('✅ User has required role:', userRole);
    return true;
  }

  // Redirect to appropriate dashboard based on role
  console.log('❌ User does not have required role. Expected:', expectedRoles, 'Got:', userRole);
  redirectToRoleDashboard(userRole, router);
  return false;
};

function redirectToRoleDashboard(role: string, router: Router): void {
  switch (role.toUpperCase()) {
    case 'FARMER':
      router.navigate(['/farmer/dashboard']);
      break;
    case 'COOPERATIVE':
      router.navigate(['/cooperative']);
      break;
    case 'GOVERNMENT':
      router.navigate(['/government/dashboard']);
      break;
    default:
      router.navigate(['/unauthorized']);
  }
}