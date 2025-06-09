import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveRequestComponentComponent } from './leave-request-component.component';

describe('LeaveRequestComponentComponent', () => {
  let component: LeaveRequestComponentComponent;
  let fixture: ComponentFixture<LeaveRequestComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveRequestComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveRequestComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
