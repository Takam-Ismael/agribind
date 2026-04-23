import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberFormComponent } from './member-form/member-form.component';

@Component({
  selector: 'app-members',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss'],
  standalone: true,
  imports: [CommonModule, MemberFormComponent]
})
export class MembersComponent {
  @ViewChild(MemberFormComponent) memberFormComponent!: MemberFormComponent;


  openAddMemberModal(): void {
    if (this.memberFormComponent) {
      this.memberFormComponent.openModal();
    }
  }

  onMemberAdded(newMember: any): void {
    console.log('Member added in MembersComponent:', newMember);
    // Add your logic here
  }

  onModalClosed(): void {
    console.log('Modal closed in MembersComponent');
  }
}
