// src/app/services/register.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterPayload {
  employeeId: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  role: string;
  password: string;
  faceImageBase64: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private readonly apiUrl = 'https://localhost:7163/api/Admin/register'; 

  constructor(private http: HttpClient) {}

  registerUser(data: RegisterPayload): Observable<any> {
    console.log(data);
    return this.http.post(this.apiUrl, data);
  }
}
