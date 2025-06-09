import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDashboardComponentComponent } from './user-dashboard-component.component';

describe('UserDashboardComponentComponent', () => {
  let component: UserDashboardComponentComponent;
  let fixture: ComponentFixture<UserDashboardComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDashboardComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDashboardComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
