import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CooperativeSidebarComponent } from './cooperative-sidebar.component';

describe('CooperativeSidebarComponent', () => {
  let component: CooperativeSidebarComponent;
  let fixture: ComponentFixture<CooperativeSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CooperativeSidebarComponent, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CooperativeSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call onClose when close button is clicked', () => {
    spyOn(component, 'onClose');
    const closeBtn = fixture.nativeElement.querySelector('.close-btn');
    closeBtn.click();
    expect(component.onClose).toHaveBeenCalled();
  });
});