import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

// DTOs and Interfaces matching the backend
export interface DiseaseReport {
  id?: number;
  reportId: string;
  farmerId?: number;
  crop: string;
  disease: string;
  location: string;
  affectedArea: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'UNDER_REVIEW' | 'CONFIRMED' | 'TREATED' | 'RESOLVED';
  reportDate: Date;
  reportedBy?: string;
  treatmentNotes?: string;
  photoPath?: string;
  createdAt?: Date;
  resolvedAt?: Date;
}

export interface PlantPhotoResponse {
  id: number;
  filename: string;
  originalFilename: string;
  fileSize: number;
  contentType: string;
  imageWidth?: number;
  imageHeight?: number;
  caption?: string;
  takenAt: Date;
  uploadedAt: Date;
  plantId: number;
  plantName: string;
  fileUrl: string;
  thumbnailUrl: string;
  downloadUrl: string;
  healthAnalysis?: HealthAnalysis;
}

export interface HealthAnalysis {
  id: number;
  healthScore: number;
  diseaseDetected: boolean;
  diseaseName?: string;
  diseaseConfidence?: number;
  recommendations: string[];
  analysisDate: Date;
  aiModelVersion: string;
}

export interface Plant {
  id?: number;
  name: string;
  scientificName?: string;
  description?: string;
  category: string;
  variety?: string;
  plantingDate?: Date;
  expectedHarvestDate?: Date;
  healthStatus: 'HEALTHY' | 'MONITORED' | 'AT_RISK' | 'DISEASED';
  location?: string;
  farmerId?: number;
}

export interface DiseaseReportSummary {
  totalReports: number;
  activeCases: number;
  resolvedCases: number;
  criticalCases: number;
  reportsByDisease: { [key: string]: number };
  reportsByLocation: { [key: string]: number };
  reportsByCrop: { [key: string]: number };
}

export interface PlantHealthSummary {
  totalPlants: number;
  healthyPlants: number;
  monitoredPlants: number;
  atRiskPlants: number;
  diseasedPlants: number;
  averageHealthScore: number;
}

export interface QuickDiseaseReportRequest {
  farmerId: number;
  crop: string;
  disease: string;
  location: string;
  affectedArea: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportDate: Date;
  reportedBy: string;
  treatmentNotes?: string;
  photos?: File[];
}

@Injectable({
  providedIn: 'root'
})
export class PlantHealthService {
  private apiUrl = environment.services.plantMonitoring;

  constructor(private http: HttpClient) {}

  // ==================== DISEASE REPORT METHODS ====================

  createQuickDiseaseReport(request: QuickDiseaseReportRequest): Observable<DiseaseReport[]> {
    const formData = new FormData();

    // Add basic fields
    formData.append('farmerId', request.farmerId.toString());
    formData.append('crop', request.crop);
    formData.append('disease', request.disease);
    formData.append('location', request.location);
    formData.append('affectedArea', request.affectedArea);
    formData.append('severity', request.severity);
    formData.append('reportDate', request.reportDate.toISOString());
    formData.append('reportedBy', request.reportedBy);

    if (request.treatmentNotes) {
      formData.append('treatmentNotes', request.treatmentNotes);
    }

    // Add photos if provided
    if (request.photos && request.photos.length > 0) {
      request.photos.forEach((photo) => {
        formData.append('photos', photo, photo.name);
      });
    }

    return this.http.post<DiseaseReport[]>(`${this.apiUrl}/disease-reports/quick-report`, formData).pipe(
      catchError(this.handleError('createQuickDiseaseReport', []))
    );
  }

  getAllDiseaseReports(): Observable<DiseaseReport[]> {
    return this.http.get<DiseaseReport[]>(`${this.apiUrl}/disease-reports`).pipe(
      catchError(this.handleError('getAllDiseaseReports', []))
    );
  }

  getDiseaseReportsPaginated(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
    search?: string;
    severity?: string;
    status?: string;
    crop?: string;
  } = {}): Observable<any> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDirection) httpParams = httpParams.set('sortDirection', params.sortDirection);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.severity) httpParams = httpParams.set('severity', params.severity);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.crop) httpParams = httpParams.set('crop', params.crop);

    return this.http.get(`${this.apiUrl}/disease-reports/paginated`, { params: httpParams }).pipe(
      catchError(this.handleError('getDiseaseReportsPaginated', { content: [], totalElements: 0, totalPages: 0 }))
    );
  }

  getDiseaseReportSummary(): Observable<DiseaseReportSummary> {
    return this.http.get<DiseaseReportSummary>(`${this.apiUrl}/disease-reports/summary`).pipe(
      catchError(this.handleError('getDiseaseReportSummary', {
        totalReports: 0,
        activeCases: 0,
        resolvedCases: 0,
        criticalCases: 0,
        reportsByDisease: {},
        reportsByLocation: {},
        reportsByCrop: {}
      }))
    );
  }

  getReportsByDisease(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/disease-reports/by-disease`).pipe(
      catchError(this.handleError('getReportsByDisease', {}))
    );
  }

  getReportsByLocation(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/disease-reports/by-location`).pipe(
      catchError(this.handleError('getReportsByLocation', {}))
    );
  }

  getDiseaseReportById(id: number): Observable<DiseaseReport> {
    return this.http.get<DiseaseReport>(`${this.apiUrl}/disease-reports/${id}`).pipe(
      catchError(this.handleError<DiseaseReport>('getDiseaseReportById'))
    );
  }

  getDiseaseReportByReportId(reportId: string): Observable<DiseaseReport> {
    return this.http.get<DiseaseReport>(`${this.apiUrl}/disease-reports/report-id/${reportId}`).pipe(
      catchError(this.handleError<DiseaseReport>('getDiseaseReportByReportId'))
    );
  }

  getReportsByFarmer(farmerId: number): Observable<DiseaseReport[]> {
    return this.http.get<DiseaseReport[]>(`${this.apiUrl}/disease-reports/farmer/${farmerId}`).pipe(
      catchError(this.handleError('getReportsByFarmer', []))
    );
  }

  getCriticalReports(): Observable<DiseaseReport[]> {
    return this.http.get<DiseaseReport[]>(`${this.apiUrl}/disease-reports/critical`).pipe(
      catchError(this.handleError('getCriticalReports', []))
    );
  }

  searchDiseaseReports(params: {
    keyword?: string;
    severity?: string;
    status?: string;
    crop?: string;
  } = {}): Observable<DiseaseReport[]> {
    let httpParams = new HttpParams();

    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.severity) httpParams = httpParams.set('severity', params.severity);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.crop) httpParams = httpParams.set('crop', params.crop);

    return this.http.get<DiseaseReport[]>(`${this.apiUrl}/disease-reports/search`, { params: httpParams }).pipe(
      catchError(this.handleError('searchDiseaseReports', []))
    );
  }

  getReportsByDateRange(startDate: Date, endDate: Date): Observable<DiseaseReport[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<DiseaseReport[]>(`${this.apiUrl}/disease-reports/date-range`, { params }).pipe(
      catchError(this.handleError('getReportsByDateRange', []))
    );
  }

  updateReportStatus(id: number, status: string, treatmentNotes?: string): Observable<DiseaseReport> {
    const body: any = { status };
    if (treatmentNotes) {
      body.treatmentNotes = treatmentNotes;
    }

    return this.http.put<DiseaseReport>(`${this.apiUrl}/disease-reports/${id}/status`, body).pipe(
      catchError(this.handleError<DiseaseReport>('updateReportStatus'))
    );
  }

  deleteDiseaseReport(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/disease-reports/${id}`).pipe(
      catchError(this.handleError<void>('deleteDiseaseReport')),
      map(() => void 0)
    );
  }

  // ==================== PLANT PHOTO METHODS ====================

  uploadPlantPhoto(plantId: number, file: File, caption?: string, takenAt?: Date): Observable<PlantPhotoResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    if (takenAt) formData.append('takenAt', takenAt.toISOString());

    return this.http.post<PlantPhotoResponse>(`${this.apiUrl}/plants/${plantId}/photos/upload`, formData).pipe(
      catchError(this.handleError<PlantPhotoResponse>('uploadPlantPhoto'))
    );
  }

  uploadMultiplePhotos(plantId: number, files: File[], caption?: string): Observable<PlantPhotoResponse[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (caption) formData.append('caption', caption);

    return this.http.post<PlantPhotoResponse[]>(`${this.apiUrl}/plants/${plantId}/photos/batch-upload`, formData).pipe(
      catchError(this.handleError('uploadMultiplePhotos', []))
    );
  }

  getPlantPhotos(plantId: number, params: {
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Observable<PlantPhotoResponse[]> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<PlantPhotoResponse[]>(`${this.apiUrl}/plants/${plantId}/photos`, { params: httpParams }).pipe(
      catchError(this.handleError('getPlantPhotos', []))
    );
  }

  getPlantPhoto(photoId: number): Observable<PlantPhotoResponse> {
    return this.http.get<PlantPhotoResponse>(`${this.apiUrl}/plants/photos/${photoId}`).pipe(
      catchError(this.handleError<PlantPhotoResponse>('getPlantPhoto'))
    );
  }

  downloadPlantPhoto(photoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plants/photos/${photoId}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('downloadPlantPhoto'))
    );
  }

  getPlantPhotoImage(photoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plants/photos/${photoId}/image`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('getPlantPhotoImage'))
    );
  }

  getPlantPhotoThumbnail(photoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plants/photos/${photoId}/thumbnail`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('getPlantPhotoThumbnail'))
    );
  }

  getPhotoHealthAnalysis(photoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/plants/photos/${photoId}/health-analysis`).pipe(
      catchError(this.handleError<any>('getPhotoHealthAnalysis'))
    );
  }

  reprocessHealthAnalysis(photoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/plants/photos/${photoId}/reprocess`, {}).pipe(
      catchError(this.handleError<any>('reprocessHealthAnalysis'))
    );
  }

  searchPhotos(keyword: string, page: number = 0, size: number = 20): Observable<PlantPhotoResponse[]> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PlantPhotoResponse[]>(`${this.apiUrl}/plants/photos/search`, { params }).pipe(
      catchError(this.handleError('searchPhotos', []))
    );
  }

  getPhotosByHealthStatus(status: string, page: number = 0, size: number = 20): Observable<PlantPhotoResponse[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PlantPhotoResponse[]>(`${this.apiUrl}/plants/photos/health-status/${status}`, { params }).pipe(
      catchError(this.handleError('getPhotosByHealthStatus', []))
    );
  }

  getPhotosWithDiseases(page: number = 0, size: number = 20): Observable<PlantPhotoResponse[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PlantPhotoResponse[]>(`${this.apiUrl}/plants/photos/diseases`, { params }).pipe(
      catchError(this.handleError('getPhotosWithDiseases', []))
    );
  }

  getRecentPhotos(count: number = 10): Observable<PlantPhotoResponse[]> {
    const params = new HttpParams().set('count', count.toString());

    return this.http.get<PlantPhotoResponse[]>(`${this.apiUrl}/plants/photos/recent`, { params }).pipe(
      catchError(this.handleError('getRecentPhotos', []))
    );
  }

  getPhotoStats(plantId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/plants/${plantId}/photos/stats`).pipe(
      catchError(this.handleError<any>('getPhotoStats'))
    );
  }

  updatePhotoCaption(photoId: number, caption: string): Observable<PlantPhotoResponse> {
    return this.http.put<PlantPhotoResponse>(`${this.apiUrl}/plants/photos/${photoId}/caption`, { caption }).pipe(
      catchError(this.handleError<PlantPhotoResponse>('updatePhotoCaption'))
    );
  }

  deletePlantPhoto(photoId: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/plants/photos/${photoId}`).pipe(
      catchError(this.handleError<void>('deletePlantPhoto')),
      map(() => void 0)
    );
  }

  batchDeletePhotos(photoIds: number[]): Observable<void> {
    return this.http.delete(`${this.apiUrl}/plants/photos/batch-delete`, {
      body: photoIds
    }).pipe(
      catchError(this.handleError<void>('batchDeletePhotos')),
      map(() => void 0)
    );
  }

  getPhotosByDateRange(startDate: Date, endDate: Date): Observable<PlantPhotoResponse[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<PlantPhotoResponse[]>(`${this.apiUrl}/plants/photos/date-range`, { params }).pipe(
      catchError(this.handleError('getPhotosByDateRange', []))
    );
  }

  // ==================== PLANT MANAGEMENT METHODS ====================

  createPlant(plant: Plant): Observable<Plant> {
    return this.http.post<Plant>(`${this.apiUrl}/plants`, plant).pipe(
      catchError(this.handleError<Plant>('createPlant'))
    );
  }

  getAllPlants(): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${this.apiUrl}/plants`).pipe(
      catchError(this.handleError('getAllPlants', []))
    );
  }

  getPlantById(id: number): Observable<Plant> {
    return this.http.get<Plant>(`${this.apiUrl}/plants/${id}`).pipe(
      catchError(this.handleError<Plant>('getPlantById'))
    );
  }

  updatePlant(id: number, plant: Plant): Observable<Plant> {
    return this.http.put<Plant>(`${this.apiUrl}/plants/${id}`, plant).pipe(
      catchError(this.handleError<Plant>('updatePlant'))
    );
  }

  deletePlant(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/plants/${id}`).pipe(
      catchError(this.handleError<void>('deletePlant')),
      map(() => void 0)
    );
  }

  searchPlants(name: string): Observable<Plant[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Plant[]>(`${this.apiUrl}/plants/search`, { params }).pipe(
      catchError(this.handleError('searchPlants', []))
    );
  }

  // ==================== UTILITY METHODS ====================

  private handleError<T>(operation = 'operation', result?: T): (error: any) => Observable<T> {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }

  // Helper method to get geolocation
  getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Helper method to calculate affected area from GPS coordinates
  calculateAffectedArea(coordinates: { lat: number; lng: number }[]): number {
    if (coordinates.length < 3) return 0;

    // Simplified area calculation using shoelace formula
    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }

    area = Math.abs(area) / 2;

    // Convert to square meters (rough approximation for small areas)
    // 1 degree latitude ≈ 111,320 meters
    // 1 degree longitude ≈ 111,320 * cos(latitude) meters
    const avgLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
    const latMeters = 111320;
    const lngMeters = 111320 * Math.cos(avgLat * Math.PI / 180);

    return Math.abs(area) * latMeters * lngMeters;
  }
}