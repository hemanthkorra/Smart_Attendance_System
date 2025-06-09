import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface AttendanceRequest {
  method: string;
  faceImageBase64?: string; // Optional for QR method
  // qrCodeData?: string; // Uncomment if you implement QR
}

interface AttendanceResponse {
  message: string;
  employeeId?: string; // From Flask
  distance?: number;  // From Flask
  error?: string;     // From Flask or C# backend
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = 'https://localhost:7163/api/Attendance/mark-or-update'; 

  constructor(private http: HttpClient) { }

  markOrUpdateAttendance(request: AttendanceRequest): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(this.apiUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side errors
      if (error.status === 0) {
        errorMessage = 'Network Error: The server is unreachable. Please check your connection or server status.';
      } else {
        errorMessage = `Server Error (${error.status}): ${error.error?.error || error.message || 'Unknown server error'}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}