import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllAttendanceComponent } from './view-all-attendance.component';

describe('ViewAllAttendanceComponent', () => {
  let component: ViewAllAttendanceComponent;
  let fixture: ComponentFixture<ViewAllAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAllAttendanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAllAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
