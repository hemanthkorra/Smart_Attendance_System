import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../Services/user-service.service';
import { AuthService } from '../../Services/auth-service.service';
import { Router } from '@angular/router';
import { dateRangeValidator } from '../validators/custom-validators';
import { CommonModule } from '@angular/common';
import { LeaveRequestPayload } from '../interfaces/interfaces';

@Component({
  selector: 'app-leave-request-component',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './leave-request-component.component.html',
  styleUrl: './leave-request-component.component.css'
})
export class LeaveRequestComponentComponent implements OnInit {
  leaveRequestForm!: FormGroup;
  userId: number | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder, // Inject FormBuilder
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId(); // Get the current user's ID

    if (this.userId === null) {
      this.errorMessage = 'User not logged in. Please log in to submit a leave request.';
      // Optionally redirect to login if user ID is missing
      // this.router.navigate(['/login']);
      return;
    }

    this.leaveRequestForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    }, { validators: dateRangeValidator }); // <--- APPLY THE CUSTOM VALIDATOR AT FORMGROUP LEVEL
  }

  // Convenience getter for easy access to form controls in the template
  get f() {
    return this.leaveRequestForm.controls;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Mark all fields as touched to display validation errors
    // Check form validity, including the group-level dateRangeValidator
    if (this.leaveRequestForm.invalid) {
      this.errorMessage = 'Please fill in all required fields and correct any date issues.';
      this.leaveRequestForm.markAllAsTouched();
      return;
    }

    if (this.userId === null) {
      this.errorMessage = 'Error: User ID not found. Cannot submit request.';
      return;
    }

    this.loading = true;

    // Get form values
    const formValues = this.leaveRequestForm.value;

    // --- Convert Dates to ISO 8601 String for Backend ---
    // This is the CRUCIAL part for backend DateTime parsing
    const startDateObj = new Date(formValues.startDate);
    const endDateObj = new Date(formValues.endDate);

    // Create the payload with ISO strings
    const requestPayload: LeaveRequestPayload = {
      userId: this.userId,
      startDate: startDateObj.toISOString(), // <--- CONVERT TO ISO STRING
      endDate: endDateObj.toISOString(),     // <--- CONVERT TO ISO STRING
      reason: formValues.reason
    };

    this.userService.submitLeaveRequest(requestPayload).subscribe({
      next: (response: string) => { // Expecting string response from backend
        this.successMessage = response || 'Leave request submitted successfully!';
        this.loading = false;
        this.leaveRequestForm.reset(); // Clear the form
        // Clear all control errors and group errors after successful reset
        Object.keys(this.f).forEach(key => {
            this.f[key].setErrors(null);
        });
        this.leaveRequestForm.setErrors(null); // Clear group-level errors
        // Optionally navigate to leaves history
        // this.router.navigate([`/user/${this.userId}/leaves-history`]);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error submitting leave request:', err);
        // Attempt to get a specific error message from the backend's 'errors' object
        if (err.error && err.error.errors) {
            let validationErrors = '';
            for (const key in err.error.errors) {
                if (err.error.errors.hasOwnProperty(key)) {
                    // Join multiple error messages for a single field
                    validationErrors += `${key}: ${err.error.errors[key].join(', ')}\n`;
                }
            }
            this.errorMessage = `Validation failed:\n${validationErrors}`;
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error; // Backend sends string message directly
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err.message) {
          this.errorMessage = err.message;
        } else {
          this.errorMessage = 'Failed to submit leave request. Please try again.';
        }
      }
    });
  }
}