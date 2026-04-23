import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InventoryItem, InventorySummary } from './inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private apiUrl = environment.services.inventory;

  constructor(private http: HttpClient) {}

  getAllInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.apiUrl).pipe(
      catchError(this.handleError<InventoryItem[]>('getAllInventory', []))
    );
  }

  getInventoryById(id: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<InventoryItem>('getInventoryById'))
    );
  }

  getInventoryByItemId(itemId: string): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/item/${itemId}`).pipe(
      catchError(this.handleError<InventoryItem>('getInventoryByItemId'))
    );
  }

  searchInventory(query: string): Observable<InventoryItem[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/search`, { params }).pipe(
      catchError(this.handleError<InventoryItem[]>('searchInventory', []))
    );
  }

  getInventoryByCategory(category: string): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/category/${category}`).pipe(
      catchError(this.handleError<InventoryItem[]>('getInventoryByCategory', []))
    );
  }

  getInventoryByStatus(status: string): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/status/${status}`).pipe(
      catchError(this.handleError<InventoryItem[]>('getInventoryByStatus', []))
    );
  }

  getInventoryByLocation(location: string): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/location/${location}`).pipe(
      catchError(this.handleError<InventoryItem[]>('getInventoryByLocation', []))
    );
  }

  getSummary(): Observable<InventorySummary> {
    return this.http.get<InventorySummary>(`${this.apiUrl}/summary`).pipe(
      catchError(this.handleError<InventorySummary>('getSummary'))
    );
  }

  createInventoryItem(item: InventoryItem): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(this.apiUrl, item).pipe(
      catchError(this.handleError<InventoryItem>('createInventoryItem'))
    );
  }

  updateInventoryItem(id: string, item: InventoryItem): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiUrl}/${id}`, item).pipe(
      catchError(this.handleError<InventoryItem>('updateInventoryItem'))
    );
  }

  deleteInventoryItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<void>('deleteInventoryItem'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
