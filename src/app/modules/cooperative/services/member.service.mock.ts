// src/app/cooperative/services/member.service.mock.ts
// Use this for development until your backend is ready

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Member, MemberStats, MemberFilters } from './member.service';

@Injectable({
  providedIn: 'root'
})
export class MockMemberService {
  private mockMembers: Member[] = [
    {
      id: '1',
      memberId: 'F001',
      type: 'Farmer',
      name: 'Kwame Osei',
      initials: 'KO',
      contact: '+237 654 123 456',
      location: {
        region: 'Northwest',
        subRegion: 'Bamenda'
      },
      details: {
        primaryCrop: 'Cocoa',
        farmSize: 5.2,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2024-01-15')
    },
    {
      id: '2',
      memberId: 'F002',
      type: 'Farmer',
      name: 'Ama Boateng',
      initials: 'AB',
      contact: '+237 677 234 567',
      location: {
        region: 'Centre',
        subRegion: 'Yaoundé'
      },
      details: {
        primaryCrop: 'Coffee',
        farmSize: 3.8,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2024-02-20')
    },
    {
      id: '3',
      memberId: 'F003',
      type: 'Farmer',
      name: 'Yaw Mensah',
      initials: 'YM',
      contact: '+237 690 345 678',
      location: {
        region: 'Southwest',
        subRegion: 'Buea'
      },
      details: {
        primaryCrop: 'Cocoa',
        farmSize: 7.5,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2024-01-10')
    },
    {
      id: '4',
      memberId: 'F004',
      type: 'Farmer',
      name: 'Akosua Darko',
      initials: 'AD',
      contact: '+237 654 456 789',
      location: {
        region: 'Littoral',
        subRegion: 'Douala'
      },
      details: {
        primaryCrop: 'Maize',
        farmSize: 4.2,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2024-03-05')
    },
    {
      id: '5',
      memberId: 'F005',
      type: 'Farmer',
      name: 'Kofi Asante',
      initials: 'KA',
      contact: '+237 677 567 890',
      location: {
        region: 'North',
        subRegion: 'Garoua'
      },
      details: {
        primaryCrop: 'Cotton',
        farmSize: 6.0,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2024-02-28')
    },
    {
      id: '6',
      memberId: 'F006',
      type: 'Farmer',
      name: 'Abena Owusu',
      initials: 'AO',
      contact: '+237 690 678 901',
      location: {
        region: 'East',
        subRegion: 'Bertoua'
      },
      details: {
        primaryCrop: 'Cocoa',
        farmSize: 4.5,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2024-04-12')
    },
    {
      id: '7',
      memberId: 'F007',
      type: 'Farmer',
      name: 'Kwabena Amoah',
      initials: 'KA',
      contact: '+237 654 789 012',
      location: {
        region: 'West',
        subRegion: 'Bafoussam'
      },
      details: {
        primaryCrop: 'Coffee',
        farmSize: 3.2,
        unit: 'ha'
      },
      status: 'Inactive',
      registrationDate: new Date('2023-12-01')
    },
    {
      id: '8',
      memberId: 'F008',
      type: 'Farmer',
      name: 'Efua Agyeman',
      initials: 'EA',
      contact: '+237 677 890 123',
      location: {
        region: 'South',
        subRegion: 'Ebolowa'
      },
      details: {
        primaryCrop: 'Cassava',
        farmSize: 2.8,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2024-03-18')
    },
    {
      id: '9',
      memberId: 'C001',
      type: 'Cooperative',
      name: 'Northwest Farmers Union',
      initials: 'NF',
      contact: '+237 654 111 222',
      location: {
        region: 'Northwest',
        subRegion: 'Bamenda'
      },
      details: {
        primaryCrop: 'Mixed',
        farmSize: 150,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2023-06-15')
    },
    {
      id: '10',
      memberId: 'G001',
      type: 'Government Official',
      name: 'Dr. Marie Nkolo',
      initials: 'MN',
      contact: '+237 677 333 444',
      location: {
        region: 'Centre',
        subRegion: 'Yaoundé'
      },
      details: {
        primaryCrop: 'N/A',
        farmSize: 0,
        unit: ''
      },
      status: 'Active',
      registrationDate: new Date('2024-01-05')
    },
    {
      id: '11',
      memberId: 'C002',
      type: 'Cooperative',
      name: 'South Region Cocoa Cooperative',
      initials: 'SR',
      contact: '+237 690 555 666',
      location: {
        region: 'South',
        subRegion: 'Ebolowa'
      },
      details: {
        primaryCrop: 'Cocoa',
        farmSize: 200,
        unit: 'ha'
      },
      status: 'Active',
      registrationDate: new Date('2023-09-20')
    },
    {
      id: '12',
      memberId: 'G002',
      type: 'Government Official',
      name: 'Mr. Paul Biya Jr.',
      initials: 'PB',
      contact: '+237 654 777 888',
      location: {
        region: 'Centre',
        subRegion: 'Yaoundé'
      },
      details: {
        primaryCrop: 'N/A',
        farmSize: 0,
        unit: ''
      },
      status: 'Active',
      registrationDate: new Date('2023-11-10')
    }
  ];

  getMembers(filters?: MemberFilters): Observable<Member[]> {
    let filteredMembers = [...this.mockMembers];

    if (filters) {
      if (filters.type) {
        filteredMembers = filteredMembers.filter(m => m.type === filters.type);
      }
      if (filters.status) {
        filteredMembers = filteredMembers.filter(m => m.status === filters.status);
      }
      if (filters.region) {
        filteredMembers = filteredMembers.filter(m => m.location.region === filters.region);
      }
      if (filters.crop) {
        filteredMembers = filteredMembers.filter(m => m.details.primaryCrop === filters.crop);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredMembers = filteredMembers.filter(m =>
          m.name.toLowerCase().includes(search) ||
          m.memberId.toLowerCase().includes(search) ||
          m.contact.includes(search)
        );
      }
    }

    return of(filteredMembers).pipe(delay(300));
  }

  getMemberStats(): Observable<MemberStats> {
    const total = this.mockMembers.length;
    const farmers = this.mockMembers.filter(m => m.type === 'Farmer').length;
    const cooperatives = this.mockMembers.filter(m => m.type === 'Cooperative').length;
    const officials = this.mockMembers.filter(m => m.type === 'Government Official').length;

    const stats: MemberStats = {
      totalMembers: total,
      farmers: farmers,
      cooperatives: cooperatives,
      governmentOfficials: officials,
      percentages: {
        farmers: Math.round((farmers / total) * 100 * 10) / 10,
        cooperatives: Math.round((cooperatives / total) * 100 * 10) / 10,
        governmentOfficials: Math.round((officials / total) * 100 * 10) / 10
      }
    };

    return of(stats).pipe(delay(200));
  }

  getMemberById(id: string): Observable<Member> {
    const member = this.mockMembers.find(m => m.id === id);
    return of(member!).pipe(delay(200));
  }

  createMember(member: Partial<Member>): Observable<Member> {
    const newMember: Member = {
      id: String(this.mockMembers.length + 1),
      memberId: `F${String(this.mockMembers.length + 1).padStart(3, '0')}`,
      type: member.type || 'Farmer',
      name: member.name || '',
      initials: member.initials || '',
      contact: member.contact || '',
      location: member.location || { region: '', subRegion: '' },
      details: member.details || { primaryCrop: '', farmSize: 0, unit: 'ha' },
      status: member.status || 'Active',
      registrationDate: new Date()
    };
    this.mockMembers.push(newMember);
    return of(newMember).pipe(delay(300));
  }

  updateMember(id: string, member: Partial<Member>): Observable<Member> {
    const index = this.mockMembers.findIndex(m => m.id === id);
    if (index !== -1) {
      this.mockMembers[index] = { ...this.mockMembers[index], ...member };
      return of(this.mockMembers[index]).pipe(delay(300));
    }
    throw new Error('Member not found');
  }

  deleteMember(id: string): Observable<void> {
    const index = this.mockMembers.findIndex(m => m.id === id);
    if (index !== -1) {
      this.mockMembers.splice(index, 1);
    }
    return of(void 0).pipe(delay(300));
  }

  bulkUpdateStatus(memberIds: string[], status: 'Active' | 'Inactive'): Observable<void> {
    memberIds.forEach(id => {
      const member = this.mockMembers.find(m => m.id === id);
      if (member) {
        member.status = status;
      }
    });
    return of(void 0).pipe(delay(300));
  }

  exportMembers(format: 'csv' | 'excel', filters?: MemberFilters): Observable<Blob> {
    // Mock CSV export
    const csvContent = 'Member ID,Name,Type,Contact,Location,Crop,Farm Size,Status\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    return of(blob).pipe(delay(500));
  }

  searchMembers(query: string): Observable<Member[]> {
    const search = query.toLowerCase();
    const results = this.mockMembers.filter(m =>
      m.name.toLowerCase().includes(search) ||
      m.memberId.toLowerCase().includes(search) ||
      m.contact.includes(search)
    );
    return of(results).pipe(delay(300));
  }
}
