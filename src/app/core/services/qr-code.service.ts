// src/app/core/services/qr-code.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QRCodeResponse {
  userId: string;
  purpose: string;
  qrCodeImage: string; // Base64 encoded
  qrCodeData: string;
  downloadUrl?: string;
  size: number;
  format: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private apiUrl = `${environment.apiUrl}/api/v1/qrcodes`;

  constructor(private http: HttpClient) {}

  /**
   * Generate registration QR code for a user
   */
  generateRegistrationQRCode(userId: string): Observable<QRCodeResponse> {
    return this.http.get<QRCodeResponse>(`${this.apiUrl}/${userId}/registration`);
  }

  /**
   * Generate login QR code for a user
   */
  generateLoginQRCode(userId: string): Observable<QRCodeResponse> {
    return this.http.get<QRCodeResponse>(`${this.apiUrl}/${userId}/login`);
  }

  /**
   * Generate profile QR code for a user
   */
  generateProfileQRCode(userId: string): Observable<QRCodeResponse> {
    return this.http.get<QRCodeResponse>(`${this.apiUrl}/${userId}/profile`);
  }

  /**
   * Download QR code as image file
   */
  downloadQRCode(userId: string, purpose: string = 'REGISTRATION'): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${userId}/download?purpose=${purpose}&size=300&format=PNG`,
      { responseType: 'blob' }
    );
  }

  /**
   * Trigger download in browser
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}