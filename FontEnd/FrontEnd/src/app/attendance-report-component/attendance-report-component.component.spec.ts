import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceReportComponentComponent } from './attendance-report-component.component';

describe('AttendanceReportComponentComponent', () => {
  let component: AttendanceReportComponentComponent;
  let fixture: ComponentFixture<AttendanceReportComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceReportComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceReportComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
