import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, RegisterRequest, EditUserRequest, UpdatePasswordRequest, AttendanceRecord, LeaveRequest } from '../app/interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://localhost:7163/api/Admin'; 
  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  registerUser(request: RegisterRequest): Observable<string> { // Changed to Observable<string>
    // Assuming register also returns a plain text success message
    return this.http.post(`${this.apiUrl}/register`, request, { responseType: 'text' });
  }

  editUser(id: number, updatedUser: EditUserRequest): Observable<string> { // Changed to Observable<string>
    console.log(`Updating user with ID: ${id}`, updatedUser);
    // Added { responseType: 'text' }
    return this.http.put(`${this.apiUrl}/edit-user/${id}`, updatedUser, { responseType: 'text' });
  }

  updateUserPassword(id: number, request: UpdatePasswordRequest): Observable<string> { // Changed to Observable<string>
    // Added { responseType: 'text' }
    return this.http.patch(`${this.apiUrl}/update-password/${id}`, request, { responseType: 'text' });
  }

  deleteUser(id: number): Observable<string> { // Changed to Observable<string>
    // Added { responseType: 'text' }
    return this.http.delete(`${this.apiUrl}/delete-user/${id}`, { responseType: 'text' });
  }

  getAllAttendance(): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/attendance-report`);
  }

  getAllLeaveRequests(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${this.apiUrl}/leave-requests`);
  }

  approveLeave(id: number): Observable<string> { // Changed to Observable<string>
    // Added { responseType: 'text' }
    return this.http.put(`${this.apiUrl}/approve-leave/${id}`, {}, { responseType: 'text' });
  }

  rejectLeave(id: number): Observable<string> { // Changed to Observable<string>
    // Added { responseType: 'text' }
    return this.http.put(`${this.apiUrl}/reject-leave/${id}`, {}, { responseType: 'text' });
  }
}