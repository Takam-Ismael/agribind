// src/app/cooperative/services/member.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Member {
  id: string;
  memberId: string;
  type: 'Farmer' | 'Cooperative' | 'Government Official';
  name: string;
  initials: string;
  contact: string;
  location: {
    region: string;
    subRegion: string;
  };
  details: {
    primaryCrop: string;
    farmSize: number;
    unit: string;
  };
  status: 'Active' | 'Inactive';
  registrationDate: Date;
}

export interface MemberStats {
  totalMembers: number;
  farmers: number;
  cooperatives: number;
  governmentOfficials: number;
  percentages: {
    farmers: number;
    cooperatives: number;
    governmentOfficials: number;
  };
}

export interface MemberFilters {
  type?: string;
  status?: string;
  region?: string;
  crop?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private apiUrl = 'https://api-gateway-pgvd.onrender.com/api/members'; // Update with your actual API URL
  private membersSubject = new BehaviorSubject<Member[]>([]);
  private statsSubject = new BehaviorSubject<MemberStats | null>(null);

  members$ = this.membersSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all members with optional filters
  getMembers(filters?: MemberFilters): Observable<Member[]> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof MemberFilters];
        if (value) {
          params = params.set(key, value);
        }
      });
    }

    return this.http.get<Member[]>(this.apiUrl, { params }).pipe(
      tap(members => this.membersSubject.next(members))
    );
  }

  // Get member statistics
  getMemberStats(): Observable<MemberStats> {
    return this.http.get<MemberStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => this.statsSubject.next(stats))
    );
  }

  // Get single member by ID
  getMemberById(id: string): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/${id}`);
  }

  // Create new member
  createMember(member: Partial<Member>): Observable<Member> {
    return this.http.post<Member>(this.apiUrl, member).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Update member
  updateMember(id: string, member: Partial<Member>): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/${id}`, member).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Delete member
  deleteMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Bulk operations
  bulkUpdateStatus(memberIds: string[], status: 'Active' | 'Inactive'): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk/status`, { memberIds, status }).pipe(
      tap(() => this.refreshMembers())
    );
  }

  // Export members
  exportMembers(format: 'csv' | 'excel', filters?: MemberFilters): Observable<Blob> {
    let params = new HttpParams().set('format', format);

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof MemberFilters];
        if (value) {
          params = params.set(key, value);
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Search members
  searchMembers(query: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('q', query)
    });
  }

  private refreshMembers() {
    this.getMembers().subscribe();
    this.getMemberStats().subscribe();
  }
}
