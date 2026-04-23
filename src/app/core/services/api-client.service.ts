// src/app/core/services/api-client.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('ApiClientService initialized with baseUrl:', this.baseUrl);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log('GET Request:', url);

    return this.http.get<T>(url, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      tap(response => console.log('GET Response:', response)),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('POST Request:', url, data);

    return this.http.post<T>(url, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('POST Response:', response)),
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('PUT Request:', url, data);

    return this.http.put<T>(url, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('PUT Response:', response)),
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('DELETE Request:', url);

    return this.http.delete<T>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('DELETE Response:', response)),
      catchError(this.handleError)
    );
  }

  patch<T>(endpoint: string, data: any = {}): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('PATCH Request:', url, data);

    return this.http.patch<T>(url, data, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('PATCH Response:', response)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);

    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || `Error Code: ${error.status}`;
    }

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error
    }));
  }
}
