// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');

  console.log('🔐 Auth Interceptor:', {
    url: req.url,
    hasToken: !!token,
    method: req.method
  });

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token && !req.url.includes('/login') && !req.url.includes('/qr-login')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Token added to request:', req.url);
  } else if (!token && !req.url.includes('/login')) {
    console.warn('⚠️ No token available for request:', req.url);
  }

  // Handle response errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ HTTP Error:', {
        status: error.status,
        message: error.message,
        url: req.url
      });

      if (error.status === 401) {
        console.log('🔒 Unauthorized - redirecting to login');
        localStorage.clear();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('🚫 Forbidden - insufficient permissions');
        console.error('Token:', token ? 'Present' : 'Missing');
        console.error('User:', localStorage.getItem('user'));
      }

      return throwError(() => error);
    })
  );
};