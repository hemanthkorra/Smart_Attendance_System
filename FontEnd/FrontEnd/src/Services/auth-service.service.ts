import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs'; // Import 'tap' operator
import { LoginCredentials, LoginResponse, User } from '../app/interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7163/api/Auth'; 
  constructor(private http: HttpClient) { }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: LoginResponse) => {
        // Store the entire user object (including role) in localStorage upon successful login
        localStorage.setItem('currentUser', JSON.stringify(response));
        console.log('AuthService: User data stored in localStorage:', response);
      })
    );
  }

  isAuthenticated(): boolean {
    const currentUser = localStorage.getItem('currentUser');
    return !!currentUser;
  }

  getCurrentUser(): User | null {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      try {
        return JSON.parse(userString) as User;
      } catch (e) {
        console.error("AuthService: Error parsing current user from localStorage", e);
        return null;
      }
    }
    return null;
  }

  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  getCurrentUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    console.log('User logged out.');
  }
}
