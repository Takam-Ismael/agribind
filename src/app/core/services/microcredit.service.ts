// src/app/core/services/microcredit.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';

// DTOs matching backend structure
export interface CashLoanDTO {
  loanId: string;
  farmerName: string;
  loanAmount: number;
  repaidAmount: number;
  balance: number;
  paidInstallments: number;
  totalInstallments: number;
  progress: number;
  purpose: string;
  dueDate: string; // ISO date string
  status: string;
  riskLevel: string;
}

export interface MaterialLoanDTO {
  // Add material loan properties based on backend
  loanId: string;
  farmerName: string;
  loanAmount: number;
  repaidAmount: number;
  balance: number;
  status: string;
  materialItems: MaterialItemDTO[];
}

export interface MaterialItemDTO {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DashboardStatsDTO {
  totalCashLoans: number;
  activeCashLoans: number;
  totalMaterialLoans: number;
  activeMaterialLoans: number;
  repaymentRate: number;
  repaymentRateChange: number;
  overdueLoansCount: number;
  overdueAmount: number;
}

export interface LoanApplicationDTO {
  farmerId: string;
  loanType: 'CASH' | 'MATERIAL';
  requestedAmount: number;
  purpose: string;
  preferredDisbursementDate: string; // ISO date string
  repaymentPeriod: number; // in months
  materialPackage?: MaterialPackageRequest;
}

export interface MaterialPackageRequest {
  packageType: string;
  items: MaterialItemDTO[];
}

export interface RepaymentRequest {
  loanId: string;
  amount: number;
  paymentMethod: string;
}

@Injectable({
  providedIn: 'root'
})
export class MicrocreditService {

  constructor(private apiClient: ApiClientService) {}

  // Dashboard statistics
  getDashboardStats(): Observable<DashboardStatsDTO> {
    return this.apiClient.get<DashboardStatsDTO>('/api/microcredit/dashboard');
  }

  // Cash loans
  getCashLoans(search?: string, status?: string, riskLevel?: string): Observable<CashLoanDTO[]> {
    const params: any = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (riskLevel) params.riskLevel = riskLevel;

    return this.apiClient.get<CashLoanDTO[]>('/api/microcredit/cash-loans', params);
  }

  // Material loans
  getMaterialLoans(search?: string, repaymentType?: string, status?: string): Observable<MaterialLoanDTO[]> {
    const params: any = {};
    if (search) params.search = search;
    if (repaymentType) params.repaymentType = repaymentType;
    if (status) params.status = status;

    return this.apiClient.get<MaterialLoanDTO[]>('/api/microcredit/material-loans', params);
  }

  // Apply for cash loan
  applyForCashLoan(application: LoanApplicationDTO): Observable<CashLoanDTO> {
    return this.apiClient.post<CashLoanDTO>('/api/microcredit/apply/cash', application);
  }

  // Apply for material loan
  applyForMaterialLoan(application: LoanApplicationDTO): Observable<MaterialLoanDTO> {
    return this.apiClient.post<MaterialLoanDTO>('/api/microcredit/apply/material', application);
  }

  // Record repayment
  recordRepayment(request: RepaymentRequest): Observable<void> {
    return this.apiClient.post<void>('/api/microcredit/repayments', request);
  }

  // Get overdue loans
  getOverdueLoans(): Observable<any[]> {
    return this.apiClient.get<any[]>('/api/microcredit/overdue-loans');
  }
}
