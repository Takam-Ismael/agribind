import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ProductionRecord, CreateProductionRequest } from './production.service';

export interface ProductionDashboardMetrics {
  totalProduction: string;
  totalProductionPercent: string;
  activeFarmers: number;
  activeFarmersParticipation: string;
  gradeAProduction: string;
  gradeAPercent: string;
  thisMonthDeliveries: string;
  thisMonthChange: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export type ExtendedProductionRecord = ProductionRecord & {
  productionId: string;
  farmerName: string;
  cropType: string;
  warehouse: string;
  deliveryDate: string;
  status: string;
};

@Injectable({
  providedIn: 'root'
})
export class MockProductionService {
  private mockProductionRecords: ExtendedProductionRecord[] = [
    {
      id: 'PROD001',
      productionId: 'PROD001',
      farmerId: '1',
      cooperativeId: 'COOP001',
      productType: 'CROP',
      productName: 'COCOA',
      farmerName: 'Kwame Osei',
      cropType: 'COCOA',
      quantity: 45.2,
      unit: 'MT',
      qualityGrade: 'GRADE_A',
      warehouse: 'Douala Warehouse',
      productionDate: '2024-01-15',
      deliveryDate: '2024-01-15',
      maturityStatus: 'VERIFIED',
      valueXaf: 9040000,
      unitPrice: 200000,
      status: 'VERIFIED'
    },
    {
      id: 'PROD002',
      productionId: 'PROD002',
      farmerId: '2',
      cooperativeId: 'COOP001',
      productType: 'CROP',
      productName: 'COFFEE',
      farmerName: 'Ama Boateng',
      cropType: 'COFFEE',
      quantity: 32.7,
      unit: 'MT',
      qualityGrade: 'GRADE_B',
      warehouse: 'Yaoundé Warehouse',
      productionDate: '2024-01-18',
      deliveryDate: '2024-01-18',
      maturityStatus: 'VERIFIED',
      valueXaf: 4905000,
      unitPrice: 150000,
      status: 'VERIFIED'
    },
    {
      id: 'PROD003',
      productionId: 'PROD003',
      farmerId: '1',
      cooperativeId: 'COOP001',
      productType: 'CROP',
      productName: 'COCOA',
      farmerName: 'Kwame Osei',
      cropType: 'COCOA',
      quantity: 38.9,
      unit: 'MT',
      qualityGrade: 'GRADE_A',
      warehouse: 'Douala Warehouse',
      productionDate: '2024-02-05',
      deliveryDate: '2024-02-05',
      maturityStatus: 'PROCESSED',
      valueXaf: 7780000,
      unitPrice: 200000,
      status: 'PROCESSED'
    },
    {
      id: 'PROD004',
      productionId: 'PROD004',
      farmerId: '3',
      cooperativeId: 'COOP002',
      productType: 'CROP',
      productName: 'COCOA',
      farmerName: 'Yaw Mensah',
      cropType: 'COCOA',
      quantity: 52.1,
      unit: 'MT',
      qualityGrade: 'GRADE_A',
      warehouse: 'Douala Warehouse',
      productionDate: '2024-02-12',
      deliveryDate: '2024-02-12',
      maturityStatus: 'SOLD',
      valueXaf: 10420000,
      unitPrice: 200000,
      status: 'SOLD'
    },
    {
      id: 'PROD005',
      productionId: 'PROD005',
      farmerId: '4',
      cooperativeId: 'COOP003',
      productType: 'CROP',
      productName: 'MAIZE',
      farmerName: 'Akosua Darko',
      cropType: 'MAIZE',
      quantity: 28.4,
      unit: 'MT',
      qualityGrade: 'GRADE_C',
      warehouse: 'Garoua Warehouse',
      productionDate: '2024-02-20',
      deliveryDate: '2024-02-20',
      maturityStatus: 'PENDING',
      valueXaf: 1420000,
      unitPrice: 50000,
      status: 'PENDING'
    },
    {
      id: 'PROD006',
      productionId: 'PROD006',
      farmerId: '6',
      cooperativeId: 'COOP004',
      productType: 'CROP',
      productName: 'COCOA',
      farmerName: 'Northwest Farmers Cooperative',
      cropType: 'COCOA',
      quantity: 125.8,
      unit: 'MT',
      qualityGrade: 'GRADE_A',
      warehouse: 'Douala Warehouse',
      productionDate: '2024-02-25',
      deliveryDate: '2024-02-25',
      maturityStatus: 'VERIFIED',
      valueXaf: 25160000,
      unitPrice: 200000,
      status: 'VERIFIED'
    }
  ];

  private nextProductionId = 7;

  getDashboardMetrics(): Observable<ProductionDashboardMetrics> {
    const metrics: ProductionDashboardMetrics = {
      totalProduction: '287.5 MT',
      totalProductionPercent: '+15.2% vs last cycle',
      activeFarmers: 245,
      activeFarmersParticipation: '81.7% participation rate',
      gradeAProduction: '168.3 MT',
      gradeAPercent: '58.5% premium quality',
      thisMonthDeliveries: '42.8 MT',
      thisMonthChange: '+8.3% vs last month'
    };

    return of(metrics).pipe(delay(400));
  }

  getProductions(params: any = {}): Observable<PageResponse<ExtendedProductionRecord>> {
    let filteredRecords = [...this.mockProductionRecords];

    // Apply filters
    if (params.cropType) {
      filteredRecords = filteredRecords.filter(record => record.cropType === params.cropType);
    }
    if (params.qualityGrade) {
      filteredRecords = filteredRecords.filter(record => record.qualityGrade === params.qualityGrade);
    }
    if (params.searchTerm) {
      const search = params.searchTerm.toLowerCase();
      filteredRecords = filteredRecords.filter(record =>
        record.farmerName.toLowerCase().includes(search) ||
        record.warehouse.toLowerCase().includes(search)
      );
    }

    // Sort by delivery date (newest first)
    filteredRecords.sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());

    const page = params.page || 0;
    const size = params.size || 20;
    const start = page * size;
    const end = start + size;
    const paginatedRecords = filteredRecords.slice(start, end);

    const response: PageResponse<ExtendedProductionRecord> = {
      content: paginatedRecords,
      totalElements: filteredRecords.length,
      totalPages: Math.ceil(filteredRecords.length / size),
      currentPage: page,
      size: size
    };

    return of(response).pipe(delay(500));
  }

  createProduction(request: CreateProductionRequest): Observable<ExtendedProductionRecord> {
    const cropType = request.productName || 'COCOA';
    const newRecord: ExtendedProductionRecord = {
      id: `PROD${this.nextProductionId.toString().padStart(3, '0')}`,
      productionId: `PROD${this.nextProductionId.toString().padStart(3, '0')}`,
      farmerId: request.farmerId,
      cooperativeId: request.cooperativeId,
      productType: request.productType,
      productName: cropType,
      farmerName: this.getFarmerName(request.farmerId),
      cropType,
      quantity: request.quantity,
      unit: request.unit,
      qualityGrade: request.qualityGrade,
      warehouse: request.notes || 'Douala Warehouse',
      productionDate: request.productionDate,
      deliveryDate: request.productionDate,
      maturityStatus: request.maturityStatus,
      unitPrice: request.unitPrice,
      valueXaf: request.valueXaf,
      status: 'PENDING'
    };

    this.mockProductionRecords.push(newRecord);
    this.nextProductionId++;

    return of(newRecord).pipe(delay(600));
  }

  getAvailableCropTypes(): Observable<string[]> {
    const crops = ['COCOA', 'COFFEE', 'MAIZE', 'CASSAVA', 'RICE', 'COTTON'];
    return of(crops).pipe(delay(300));
  }

  getQualityGrades(): Observable<string[]> {
    const grades = ['GRADE_A', 'GRADE_B', 'GRADE_C'];
    return of(grades).pipe(delay(300));
  }

  getWarehouses(): Observable<string[]> {
    const warehouses = ['Douala Warehouse', 'Yaoundé Warehouse', 'Garoua Warehouse', 'Bamenda Warehouse'];
    return of(warehouses).pipe(delay(300));
  }

  private getFarmerName(farmerId: string): string {
    const farmerNames: { [key: string]: string } = {
      '1': 'Kwame Osei',
      '2': 'Ama Boateng',
      '3': 'Yaw Mensah',
      '4': 'Akosua Darko',
      '5': 'Kofi Asante',
      '6': 'Northwest Farmers Cooperative',
      '7': 'South Region Cocoa Cooperative'
    };
    return farmerNames[farmerId] || 'Unknown Farmer';
  }

  private calculateValue(cropType: string, quantity: number, grade: string = 'GRADE_C'): number {
    const basePrices: { [key: string]: number } = {
      'COCOA': 200000,
      'COFFEE': 150000,
      'MAIZE': 50000,
      'CASSAVA': 30000,
      'RICE': 80000,
      'COTTON': 120000
    };

    const gradeMultipliers: { [key: string]: number } = {
      'GRADE_A': 1.0,
      'GRADE_B': 0.8,
      'GRADE_C': 0.6
    };

    const basePrice = basePrices[cropType] || 50000;
    const multiplier = gradeMultipliers[grade] || 0.7;

    return Math.round(quantity * basePrice * multiplier);
  }
}
