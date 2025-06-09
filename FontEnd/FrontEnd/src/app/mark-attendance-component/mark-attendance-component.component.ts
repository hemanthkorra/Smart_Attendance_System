import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subject, Subscription, switchMap, takeUntil, timer } from 'rxjs';
import { AttendanceService } from '../../Services/attendance-service.service';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mark-attendance-component',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './mark-attendance-component.component.html',
  styleUrl: './mark-attendance-component.component.css'
})
export class MarkAttendanceComponentComponent {
 @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  attendanceForm!: FormGroup;
  mediaStream: MediaStream | null = null;
  canvas: HTMLCanvasElement | null = null;
  context: CanvasRenderingContext2D | null = null;

  isProcessingCapture = false; // Controls the loading spinner on the capture button

  detectionMessage: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  private destroy$ = new Subject<void>(); // Used to unsubscribe from observables on component destruction

  constructor(private attendanceService: AttendanceService) { }

  ngOnInit(): void {
    this.attendanceForm = new FormGroup({
      method: new FormControl('Face', Validators.required)
    });

    this.attendanceForm.get('method')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(method => {
      if (method === 'Face') {
        this.startVideoAndDetection();
      } else {
        this.stopVideoAndDetection(); // This stops video
        this.detectionMessage = 'Select "Face" to start attendance.';
        this.resetMessages(); // Reset other messages if method changes
      }
    });

    // Initial message set during ngOnInit
    this.detectionMessage = 'Select "Face" and allow camera access to begin.';
  }

  ngAfterViewInit(): void {
    // Ensure video starts only if 'Face' method is selected and view is initialized
    if (this.attendanceForm.get('method')?.value === 'Face') {
      // Use setTimeout to ensure videoElement is available in the DOM
      setTimeout(() => {
        this.startVideoAndDetection();
      }, 0);
    }
  }

  /**
   * Starts the video stream from the user's camera and initializes the canvas for capture.
   */
  startVideoAndDetection(): void {
    this.resetMessages(); // Reset messages when starting video
    this.detectionMessage = 'Starting camera... Please allow camera access.';

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream: MediaStream) => {
        this.mediaStream = stream;
        this.videoElement.nativeElement.srcObject = this.mediaStream;
        return this.videoElement.nativeElement.play(); // Play the video stream
      })
      .then(() => {
        this.detectionMessage = 'Camera ready. Click "Capture Attendance" button.';

        const video = this.videoElement.nativeElement;
        // Initialize canvas and context once video metadata is loaded
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          this.initializeCanvas(video.videoWidth, video.videoHeight);
        } else {
          // Fallback if videoWidth/Height are not immediately available
          video.addEventListener('loadedmetadata', () => {
            if (!this.canvas) { // Only initialize if not already done
              this.initializeCanvas(video.videoWidth, video.videoHeight);
            }
          }, { once: true }); // Listen only once
        }
      })
      .catch((err: any) => {
        console.error('Error accessing camera:', err);
        this.errorMessage = 'Could not access camera. Please ensure it is connected and permissions are granted.';
        this.detectionMessage = 'Camera access denied.';
        this.isProcessingCapture = false; // Ensure button is not stuck in processing state
      });
  }

  /**
   * Initializes the canvas element with the given dimensions.
   * @param width The width of the canvas.
   * @param height The height of the canvas.
   */
  private initializeCanvas(width: number, height: number): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext('2d');
  }

  /**
   * Stops the video stream from the user's camera.
   */
  stopVideoAndDetection(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isProcessingCapture = false; // Ensure this is false after stopping
  }

  /**
   * Handles the click event for the "Capture Attendance" button.
   * Captures an image from the video feed and sends it for attendance marking.
   */
  onCaptureClick(): void {
    // Disable button only if no media stream, or if already processing
    if (!this.mediaStream || this.isProcessingCapture) {
      this.errorMessage = 'Camera not ready or a capture is already in progress.';
      return;
    }

    // Ensure canvas and context are available before proceeding
    if (!this.canvas || !this.context) {
        this.errorMessage = 'Camera is ready, but canvas for capture is not initialized. Please wait a moment or try again.';
        return;
    }

    this.resetMessages(); // Clear messages BEFORE starting a new capture attempt
    this.isProcessingCapture = true; // Set processing flag
    this.detectionMessage = 'Capturing image and sending for detection...';

    const video = this.videoElement.nativeElement;
    // Ensure canvas dimensions match video for capture
    if (this.canvas.width !== video.videoWidth || this.canvas.height !== video.videoHeight) {
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;
    }
    this.context.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
    const imageDataUrl = this.canvas.toDataURL('image/jpeg', 0.9); // Capture image as JPEG
    const base64Image = imageDataUrl.split(',')[1]; // Extract base64 part

    this.markAttendanceWithFace(base64Image);
  }

  /**
   * Calls the attendance service to mark or update attendance using face recognition.
   * @param faceImageBase64 The base64 encoded image of the user's face.
   */
  private markAttendanceWithFace(faceImageBase64: string): void {
    this.attendanceService.markOrUpdateAttendance({
      method: 'Face',
      faceImageBase64: faceImageBase64
    }).pipe(
      finalize(() => {
        // This block will execute regardless of success or error
        this.isProcessingCapture = false; // IMPORTANT: Allow new captures
      })
    ).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        if (response.employeeId) {
          this.successMessage += ` (Employee ID: ${response.employeeId})`;
        }
        // Display success message for a short duration
        setTimeout(() => {
          this.resetMessages(); // Clear messages, making the success message disappear
        }, 3000); // Display success message for 3 seconds
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Failed to mark attendance. Please try again.';
        this.detectionMessage = 'Failed to mark attendance. Try again.';

        // Display error message for a longer duration before clearing
        setTimeout(() => {
          this.resetMessages(); // Clear error messages
        }, 5000); // Display error message for 5 seconds
      }
    });
  }

  /**
   * Resets all message properties (detection, error, success).
   */
  resetMessages(): void {
    this.detectionMessage = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Lifecycle hook called when the component is destroyed.
   * Ensures all subscriptions are unsubscribed and video stream is stopped.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopVideoAndDetection(); // Ensure video is stopped on component destruction
  }
}

