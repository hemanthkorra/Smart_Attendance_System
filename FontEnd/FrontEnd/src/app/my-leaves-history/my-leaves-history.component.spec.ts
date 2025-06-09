import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyLeavesHistoryComponent } from './my-leaves-history.component';

describe('MyLeavesHistoryComponent', () => {
  let component: MyLeavesHistoryComponent;
  let fixture: ComponentFixture<MyLeavesHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyLeavesHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyLeavesHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
