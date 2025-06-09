import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth-service.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginResponse } from '../interfaces/interfaces';

@Component({
  selector: 'app-login-component-component',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-component-component.component.html',
  styleUrl: './login-component-component.component.css'
})
export class LoginComponentComponentComponent implements OnInit {
 loginForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false; // New loading state property

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter both username and password.';
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true; // Set loading to true when starting login

    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false; // Set loading to false on success
        this.successMessage = `Welcome, ${response.fullName}! Redirecting...`;
        console.log('Login successful. Navigating to user dashboard.');
        this.router.navigate(['/user', response.id]);
      },
      error: (err: any) => {
        this.isLoading = false; // Set loading to false on error
        console.error('Login error:', err);
        this.errorMessage = 'Invalid username or password.';
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }
}
