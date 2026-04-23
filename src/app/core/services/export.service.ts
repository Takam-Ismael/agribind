// src/app/core/services/export.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExportQuery {
  type?: string;
  status?: string;
  region?: string;
  format: string; // CSV, EXCEL, PDF
  includeProfile?: boolean;
  includeAgriculturalData?: boolean;
  columns?: string[];
}

export interface ExportResponse {
  exportId: string;
  filename: string;
  format: string;
  recordCount: number;
  fileSize: number;
  downloadUrl: string;
  generatedAt: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private apiUrl = `${environment.apiUrl}/exports`;

  constructor(private http: HttpClient) {}

  /**
   * Generate export file
   */
  generateExport(query: ExportQuery): Observable<ExportResponse> {
    return this.http.post<ExportResponse>(`${this.apiUrl}/generate`, query);
  }

  /**
   * Quick export with filters
   */
  quickExport(
    type?: string,
    status?: string,
    region?: string,
    format: string = 'EXCEL'
  ): Observable<ExportResponse> {
    let params = new HttpParams().set('format', format);

    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);
    if (region) params = params.set('region', region);

    return this.http.post<ExportResponse>(
      `${this.apiUrl}/quick-export`,
      null,
      { params }
    );
  }

  /**
   * Download export file
   */
  downloadExport(exportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${exportId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Get export status
   */
  getExportStatus(exportId: string): Observable<ExportResponse> {
    return this.http.get<ExportResponse>(`${this.apiUrl}/status/${exportId}`);
  }

  /**
   * Trigger browser download
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

  /**
   * Export current filtered data
   */
  exportFilteredData(filters: any, format: string = 'EXCEL'): Observable<ExportResponse> {
    const query: ExportQuery = {
      type: filters.type,
      status: filters.status,
      region: filters.region,
      format: format,
      includeProfile: true,
      includeAgriculturalData: true
    };

    return this.generateExport(query);
  }
}