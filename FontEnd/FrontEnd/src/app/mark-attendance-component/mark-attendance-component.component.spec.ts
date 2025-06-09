import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkAttendanceComponentComponent } from './mark-attendance-component.component';

describe('MarkAttendanceComponentComponent', () => {
  let component: MarkAttendanceComponentComponent;
  let fixture: ComponentFixture<MarkAttendanceComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkAttendanceComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkAttendanceComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
