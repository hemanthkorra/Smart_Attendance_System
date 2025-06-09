import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { finalize, Observable, Subject } from 'rxjs';
import { RegisterPayload, RegisterService } from '../../Services/register-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-user-component',
  imports: [WebcamModule,ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './register-user-component.component.html',
  styleUrl: './register-user-component.component.css'
})
export class RegisterUserComponentComponent {
employeeId = '';
  username = '';
  fullName = '';
  email = '';
  department = '';
  role = '';
  password = '';

  webcamImage: WebcamImage | null = null;
  private trigger: Subject<void> = new Subject<void>();

  errorMessage: string | null = null;
  successMessage: string | null = null;
  isRegistering: boolean = false; // New flag for loading spinner

  constructor(private registerService: RegisterService) {}

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  /**
   * Triggers the webcam to capture an image.
   * Clears existing messages before capture.
   */
  captureImage(): void {
    this.clearMessages(); // Clear messages before new action
    this.trigger.next();
  }

  /**
   * Handles the captured image from the webcam.
   * @param webcamImage The captured image object.
   */
  handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.successMessage = 'Face image captured successfully!';
    setTimeout(() => this.clearMessages(), 3000); // Clear success message after 3 seconds
  }

  /**
   * Handles the user registration process.
   * Performs client-side validation and calls the registration service.
   */
  register(): void {
    this.clearMessages(); // Clear previous messages

    if (!this.webcamImage) {
      this.errorMessage = 'Please capture your face image before registering.';
      return;
    }

    // Basic client-side validation for required fields
    if (!this.employeeId || !this.username || !this.fullName || !this.email || !this.password) {
        this.errorMessage = 'Please fill in all required fields (Employee ID, Username, Full Name, Email, Password).';
        return;
    }

    this.isRegistering = true; // Start loading spinner

    const payload: RegisterPayload = {
      employeeId: this.employeeId,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
      department: this.department,
      role: this.role,
      password: this.password,
      faceImageBase64: this.webcamImage.imageAsDataUrl // Ensure this is the base64 string
    };

    this.registerService.registerUser(payload).pipe(
      finalize(() => {
        this.isRegistering = false; // Stop loading spinner regardless of success or error
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Registration successful!';
        // Delay resetting the form fields and clearing webcam image for user acknowledgment
        setTimeout(() => {
          this.employeeId = '';
          this.username = '';
          this.fullName = '';
          this.email = '';
          this.department = '';
          this.role = '';
          this.password = '';
          this.webcamImage = null; // Clear the displayed image
          this.clearMessages(); // Clear success message after form resets
        }, 2000); // 2-second delay for acknowledgment
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err, 'Registration failed');
      }
    });
  }

  /**
   * Clears any displayed error or success messages.
   */
  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  /**
   * Extracts a user-friendly error message from an HTTP error response.
   * This handles cases where the backend might return plain text instead of JSON.
   * @param err The HTTP error object.
   * @param defaultMessage A default message to use if a specific error cannot be extracted.
   * @returns A string containing the error message.
   */
  private extractErrorMessage(err: any, defaultMessage: string = 'An unknown error occurred'): string {
    let message = '';
    if (err.error) {
      if (typeof err.error === 'string') {
        // If err.error is a string, it might be the direct error message or an HTML string.
        // Try to parse it as JSON first, if it fails, use it as plain text.
        try {
          const parsedError = JSON.parse(err.error);
          message = parsedError.error || parsedError.message || err.error;
        } catch (e) {
          message = err.error; // It's a plain string, use it directly
        }
      } else if (err.error.message) {
        // If err.error is an object with a 'message' property
        message = err.error.message;
      } else if (err.error.error) {
        // If err.error is an object with an 'error' property (common for API errors)
        message = err.error.error;
      } else {
        // Fallback for other object structures
        message = JSON.stringify(err.error);
      }
    } else if (err.message) {
      // Fallback to the generic Angular error message
      message = err.message;
    } else {
      message = 'No specific error message provided.';
    }
    return `${defaultMessage}: ${message}`;
  }
}
