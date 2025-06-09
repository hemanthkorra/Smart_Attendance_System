import { TestBed } from '@angular/core/testing';

import { AttendanceServiceService } from './attendance-service.service';

describe('AttendanceServiceService', () => {
  let service: AttendanceServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttendanceServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
