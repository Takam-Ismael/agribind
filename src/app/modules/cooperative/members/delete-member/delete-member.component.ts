import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Member {
  id: string;
  name: string;
  phone: string;
  type: string;
  region: string;
  primaryCrop: string;
  status: string;
  email?: string;
  joinDate?: string;
  farmSize?: string;
  address?: string;
  farmLocation?: string;
  lastProduction?: string;
  creditStatus?: string;
}

@Component({
  selector: 'app-delete-member',
  templateUrl: './delete-member.component.html',
  styleUrls: ['./delete-member.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DeleteMemberComponent implements OnInit {
  @Output() memberDeleted = new EventEmitter<Member>();
  @Output() modalClosed = new EventEmitter<void>();

  @Input() member: Member | null = null;

  isModalOpen = false;
  isDeleting = false;

  ngOnInit(): void {
    console.log('DeleteMemberComponent initialized');
  }

  openModal(member: Member): void {
    console.log('Opening delete confirmation for member:', member);
    this.member = member;
    this.isModalOpen = true;
    this.isDeleting = false;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.member = null;
    this.isDeleting = false;
    document.body.style.overflow = 'auto';
    this.modalClosed.emit();
  }

  confirmDelete(): void {
    if (this.member) {
      this.isDeleting = true;
      console.log('Confirming deletion of member:', this.member);

      // Simulate API call delay
      setTimeout(() => {
        this.memberDeleted.emit(this.member!);
        this.closeModal();
      }, 1000);
    }
  }
}
