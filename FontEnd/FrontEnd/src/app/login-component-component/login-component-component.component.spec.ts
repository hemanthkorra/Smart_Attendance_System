import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponentComponentComponent } from './login-component-component.component';

describe('LoginComponentComponentComponent', () => {
  let component: LoginComponentComponentComponent;
  let fixture: ComponentFixture<LoginComponentComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponentComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponentComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
