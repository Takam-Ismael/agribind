import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { User, PageResponse, UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class MockUserService extends UserService {
  private mockUsers: User[] = [
    {
      userId: '1',
      name: 'Kwame Osei',
      email: 'kwame.osei@example.com',
      phoneNumber: '+237 654 123 456',
      type: 'FARMER',
      status: 'ACTIVE',
      region: 'NORD_OUEST',
      department: 'Bamenda',
      village: 'Bambili',
      district: 'Mezam',
      preferredLanguage: 'en',
      agriculturalType: 'MIXED',
      cropTypes: ['Cocoa', 'Coffee'],
      landArea: 5.2
    },
    {
      userId: '2',
      name: 'Ama Boateng',
      email: 'ama.boateng@example.com',
      phoneNumber: '+237 677 234 567',
      type: 'FARMER',
      status: 'ACTIVE',
      region: 'CENTRE',
      department: 'Mfoundi',
      village: 'Efoulan',
      district: 'Yaoundé',
      preferredLanguage: 'fr',
      agriculturalType: 'MIXED',
      cropTypes: ['Coffee', 'Maize'],
      landArea: 3.8
    },
    {
      userId: '3',
      name: 'Yaw Mensah',
      email: 'yaw.mensah@example.com',
      phoneNumber: '+237 690 345 678',
      type: 'FARMER',
      status: 'INACTIVE',
      region: 'SUD_OUEST',
      department: 'Fako',
      village: 'Buea',
      district: 'Buea',
      preferredLanguage: 'en',
      agriculturalType: 'MIXED',
      cropTypes: ['Cocoa'],
      landArea: 7.5
    },
    {
      userId: '4',
      name: 'Akosua Darko',
      email: 'akosua.darko@example.com',
      phoneNumber: '+237 654 456 789',
      type: 'FARMER',
      status: 'ACTIVE',
      region: 'LITTORAL',
      department: 'Wouri',
      village: 'Bonaberi',
      district: 'Douala',
      preferredLanguage: 'fr',
      agriculturalType: 'MIXED',
      cropTypes: ['Maize', 'Cassava'],
      landArea: 4.2
    },
    {
      userId: '5',
      name: 'Kofi Asante',
      email: 'kofi.asante@example.com',
      phoneNumber: '+237 677 567 890',
      type: 'FARMER',
      status: 'PENDING',
      region: 'NORD',
      department: 'Bénoué',
      village: 'Garoua',
      district: 'Garoua',
      preferredLanguage: 'fr',
      agriculturalType: 'MIXED',
      cropTypes: ['Cotton'],
      landArea: 6.0
    },
    {
      userId: '6',
      name: 'Northwest Farmers Cooperative',
      email: 'info@nwfarmers.coop',
      phoneNumber: '+237 654 111 222',
      type: 'COOPERATIVE',
      status: 'ACTIVE',
      region: 'NORD_OUEST',
      department: 'Bamenda',
      village: 'Bamenda',
      district: 'Mezam',
      preferredLanguage: 'en',
      agriculturalType: 'MIXED',
      cropTypes: ['Cocoa', 'Coffee', 'Maize'],
      landArea: 150
    },
    {
      userId: '7',
      name: 'South Region Cocoa Cooperative',
      email: 'contact@southcocoa.coop',
      phoneNumber: '+237 690 555 666',
      type: 'COOPERATIVE',
      status: 'ACTIVE',
      region: 'SUD',
      department: 'Mvila',
      village: 'Ebolowa',
      district: 'Ebolowa',
      preferredLanguage: 'fr',
      agriculturalType: 'MIXED',
      cropTypes: ['Cocoa'],
      landArea: 200
    },
    {
      userId: '8',
      name: 'Dr. Marie Nkolo',
      email: 'marie.nkolo@gov.cm',
      phoneNumber: '+237 677 333 444',
      type: 'GOVERNMENT',
      status: 'ACTIVE',
      region: 'CENTRE',
      department: 'Mfoundi',
      village: 'Yaoundé',
      district: 'Yaoundé',
      preferredLanguage: 'fr',
      agriculturalType: 'NONE',
      cropTypes: [],
      landArea: 0
    }
  ];

  private nextUserId = 9;

  override getUsers(page: number = 0, size: number = 10, filters: any = {}): Observable<PageResponse<User>> {
    let filteredUsers = [...this.mockUsers];

    // Apply filters
    if (filters.status) {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }
    if (filters.region) {
      filteredUsers = filteredUsers.filter(user => user.region === filters.region);
    }
    if (filters.type) {
      filteredUsers = filteredUsers.filter(user => user.type === filters.type);
    }
    if (filters.primaryCrop) {
      filteredUsers = filteredUsers.filter(user =>
        user.cropTypes?.includes(filters.primaryCrop)
      );
    }
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.phoneNumber.includes(search)
      );
    }

    // Sort by name for consistency
    filteredUsers.sort((a, b) => a.name.localeCompare(b.name));

    const start = page * size;
    const end = start + size;
    const paginatedUsers = filteredUsers.slice(start, end);

    const response: PageResponse<User> = {
      content: paginatedUsers,
      totalElements: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / size),
      currentPage: page,
      size: size
    };

    return of(response).pipe(delay(500));
  }

  override getFarmers(page: number = 0, size: number = 10): Observable<PageResponse<User>> {
    return this.getUsers(page, size, { type: 'FARMER' });
  }

  override getCooperatives(page: number = 0, size: number = 10): Observable<PageResponse<User>> {
    return this.getUsers(page, size, { type: 'COOPERATIVE' });
  }

  override getUserById(id: string): Observable<User> {
    const user = this.mockUsers.find(u => u.userId === id || u.id === id);
    if (user) {
      return of(user).pipe(delay(300));
    } else {
      throw new Error(`User with id ${id} not found`);
    }
  }

  override createUser(user: User): Observable<User> {
    const newUser: User = {
      ...user,
      userId: this.nextUserId.toString(),
      id: this.nextUserId.toString(),
      status: user.status || 'PENDING'
    };

    this.mockUsers.push(newUser);
    this.nextUserId++;

    return of(newUser).pipe(delay(400));
  }

  override updateUser(id: string, updates: Partial<User>): Observable<User> {
    const index = this.mockUsers.findIndex(u => u.userId === id || u.id === id);
    if (index !== -1) {
      this.mockUsers[index] = { ...this.mockUsers[index], ...updates };
      return of(this.mockUsers[index]).pipe(delay(400));
    } else {
      throw new Error(`User with id ${id} not found`);
    }
  }

  override deleteUser(id: string): Observable<void> {
    const index = this.mockUsers.findIndex(u => u.userId === id || u.id === id);
    if (index !== -1) {
      this.mockUsers.splice(index, 1);
      return of(void 0).pipe(delay(400));
    } else {
      throw new Error(`User with id ${id} not found`);
    }
  }

  override exportUsers(format: string, filters: any = {}): Observable<Blob> {
    // Create mock CSV content
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Type', 'Status', 'Region', 'Crops', 'Farm Size'];
    let csvContent = headers.join(',') + '\n';

    this.mockUsers.forEach(user => {
      const row = [
        user.userId,
        `"${user.name}"`,
        user.email || '',
        user.phoneNumber,
        user.type,
        user.status || '',
        user.region || '',
        `"${user.cropTypes?.join('; ') || ''}"`,
        user.landArea?.toString() || '0'
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    return of(blob).pipe(delay(600));
  }
}
