import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginCredentials, LoginResponse, User, AttendanceRecordItem, AttendanceReport, LeaveRequestHistoryItem, LeaveRequestPayload } from '../app/interfaces/interfaces';  // <--- Import interfaces

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:7163/api/User';
  private attendanceApiUrl = 'https://localhost:7163/api/Attendance'; 

  constructor(private http: HttpClient) { }

  getUserProfile(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile?userId=${userId}`);
  }

  getAttendanceReport(userId: number): Observable<AttendanceReport> {
    return this.http.get<AttendanceReport>(`${this.apiUrl}/attendance-report?userId=${userId}`);
  }

  getMyLeaveRequests(userId: number): Observable<LeaveRequestHistoryItem[]> {
    return this.http.get<LeaveRequestHistoryItem[]>(`${this.attendanceApiUrl}/my-leaves/${userId}`);
  }

  /**
   * Submits a new leave request to the backend.
   * @param leaveRequestData The payload containing leave details.
   * @returns An Observable with the backend's response.
   */
  submitLeaveRequest(leaveRequestData: LeaveRequestPayload): Observable<string> { // Expecting a string message
    // The endpoint is `api/User/leave-request` based on your backend controller and method attributes
    return this.http.post(`${this.attendanceApiUrl}/leave-request`, leaveRequestData, { responseType: 'text' }); // <--- CRUCIAL CHANGE HERE
  }
}