// production.service.ts - Updated to match Java backend
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductionRecord {
  id?: string;
  farmerId: string;
  cooperativeId: string;
  productType: string; // 'CROP' | 'LIVESTOCK'
  productName: string; // e.g., 'COCOA', 'MAIZE'
  quantity: number;
  unit: string; // e.g., 'MT' for Metric Ton
  qualityGrade?: string;
  maturityStatus: string; // 'IMMATURE' | 'MATURE' | 'READY_FOR_HARVEST' | 'HARVESTED'
  productionDate: string;
  harvestDate?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  notes?: string;
  unitPrice: number;
  valueXaf: number;
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: string;
}

export interface ProductionAggregateDTO {
  cooperativeId: string;
  cooperativeName: string;
  productName: string;
  productType: string;
  totalQuantity: number;
  unit: string;
  totalFarmers: number;
  topContributors: FarmerContributionSummary[];
  periodDescription: string;
}

export interface FarmerContributionSummary {
  farmerId: string;
  farmerName: string;
  farmerRegistrationNumber: string;
  quantityContributed: number;
  unit: string;
  contributionCount: number;
  percentageOfTotal: number;
}

export interface ProductionDashboardDTO {
  cooperativeId: string;
  cooperativeName: string;
  productionByType: ProductionAggregateDTO[];
  farmersByProduct: { [key: string]: number };
  totalActiveFarmers: number;
  reportPeriod: string;
  statistics: { [key: string]: any };
}

export interface CreateProductionRequest {
  farmerId: string;
  cooperativeId: string;
  productType: string;
  productName: string;
  quantity: number;
  unit: string;
  qualityGrade?: string;
  maturityStatus: string;
  productionDate: string;
  unitPrice: number;
  valueXaf: number;
  harvestDate?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  notes?: string;
}

export interface MaturityUpdateDTO {
  productionRecordId: string;
  newStatus: string;
  farmerId: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
  private baseUrl = environment.services.productionApiUrl;

  constructor(private http: HttpClient) {}

  // Record new production
  createProduction(request: CreateProductionRequest): Observable<ProductionRecord> {
    return this.http.post<ProductionRecord>(`${this.baseUrl}/record`, request);
  }

  // Get production aggregate
  getProductionAggregate(
    cooperativeId: string,
    productName: string,
    startDate: string,
    endDate: string
  ): Observable<ProductionAggregateDTO> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ProductionAggregateDTO>(
      `${this.baseUrl}/aggregate/${cooperativeId}/${productName}`,
      { params }
    );
  }

  // Get production dashboard
  getDashboard(cooperativeId: string, startDate: string, endDate: string): Observable<ProductionDashboardDTO> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ProductionDashboardDTO>(
      `${this.baseUrl}/dashboard/${cooperativeId}`,
      { params }
    );
  }

  // Get farmer production history
  getFarmerHistory(farmerId: string): Observable<ProductionRecord[]> {
    return this.http.get<ProductionRecord[]>(`${this.baseUrl}/farmer/${farmerId}/history`);
  }

  // Update maturity status
  updateMaturityStatus(update: MaturityUpdateDTO): Observable<ProductionRecord> {
    return this.http.put<ProductionRecord>(`${this.baseUrl}/maturity`, update);
  }

  // Get products by maturity status
  getProductsByMaturityStatus(
    cooperativeId: string,
    productName: string,
    status: string
  ): Observable<ProductionRecord[]> {
    const params = new HttpParams()
      .set('productName', productName)
      .set('status', status);

    return this.http.get<ProductionRecord[]>(
      `${this.baseUrl}/cooperative/${cooperativeId}/maturity`,
      { params }
    );
  }

  // Get all production records for a cooperative with pagination
  getProductionRecords(
    cooperativeId: string,
    page: number = 0,
    size: number = 10,
    productName?: string,
    qualityGrade?: string,
    searchTerm?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (productName) params = params.set('productName', productName);
    if (qualityGrade) params = params.set('qualityGrade', qualityGrade);
    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<any>(`${this.baseUrl}/cooperative/${cooperativeId}`, { params });
  }

  // Get production record by ID
  getProductionRecordById(id: string): Observable<ProductionRecord> {
    return this.http.get<ProductionRecord>(`${this.baseUrl}/${id}`);
  }

  // Update production record
  updateProductionRecord(id: string, request: CreateProductionRequest): Observable<ProductionRecord> {
    return this.http.put<ProductionRecord>(`${this.baseUrl}/${id}`, request);
  }

  // Delete production record
  deleteProductionRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Health check
  healthCheck(): Observable<{ success: boolean; message: string }> {
    return this.http.get<{ success: boolean; message: string }>(`${this.baseUrl}/health`);
  }
}