import { Component } from '@angular/core';
import { LoginResponse } from '../interfaces/interfaces';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth-service.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-login-component',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './admin-login-component.component.html',
  styleUrl: './admin-login-component.component.css'
})
export class AdminLoginComponentComponent {
adminLoginForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false; // New loading state property

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.adminLoginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.adminLoginForm.invalid) {
      this.errorMessage = 'Please enter both username and password.';
      this.adminLoginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true; // Set loading to true when starting login

    const { username, password } = this.adminLoginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false; // Set loading to false on success
        // Upon successful login, store the user data (already handled by AuthService.login's tap)
        // Now, check the role specifically for admin login
        if (response.role === 'Admin') {
          this.successMessage = `Welcome, Admin ${response.fullName}! Redirecting...`;
          console.log('Admin login successful. Navigating to admin dashboard.');
          this.router.navigate(['/admin']);
        } else {
          // If credentials are valid but the role is NOT Admin, deny access
          this.errorMessage = 'Access Denied: You do not have administrator privileges.';
          console.warn('Login successful but role is not Admin:', response.role);
          this.authService.logout(); // Crucial: Log out the user if they're not an admin trying to access admin login
        }
      },
      error: (err: any) => {
        this.isLoading = false; // Set loading to false on error
        console.error('Admin login error:', err);
        // Generic error message for security
        this.errorMessage = 'Invalid username or password.';
      }
    });
  }

  get f() {
    return this.adminLoginForm.controls;
  }
}
