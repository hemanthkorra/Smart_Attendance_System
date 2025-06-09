import { Component } from '@angular/core';
import { User } from '../interfaces/interfaces';
import { UserService } from '../../Services/user-service.service';
import { AuthService } from '../../Services/auth-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
userProfile: User | null = null;
  loadingProfile: boolean = true;
  errorProfile: string | null = null;
  userId: number | null = null; // Add userId here to fetch profile

  constructor(
    private userService: UserService,
    private authService: AuthService, // If you need authService in profile
    private route: ActivatedRoute, // To get userId from route if profile component is directly accessed
    private router: Router // To redirect if something goes wrong
  ) { }

  ngOnInit(): void {
    console.log('ProfileComponent: ngOnInit started.');
    // The AuthGuard already ensures the user is authenticated and userId matches
    // So we can directly get the authenticated user ID here.
    this.userId = this.authService.getCurrentUserId();

    if (this.userId) {
      this.fetchUserProfile(this.userId);
    } else {
      // This should ideally not happen if AuthGuard is working, but as a fallback
      this.errorProfile = 'User ID not found for profile. Redirecting to login.';
      this.router.navigate(['/login']);
    }
  }

  fetchUserProfile(id: number): void {
    this.loadingProfile = true;
    this.errorProfile = null;
    this.userService.getUserProfile(id)
      .subscribe({
        next: (data: User) => {
          console.log('ProfileComponent: User profile fetched successfully:', data);
          this.userProfile = data;
          this.loadingProfile = false;
        },
        error: (err) => {
          console.error('ProfileComponent: Error fetching user profile:', err);
          this.errorProfile = 'Failed to load user profile. Please try again.';
          this.loadingProfile = false;
          // Optionally, redirect to login or show a critical error
          // this.authService.logout();
          // this.router.navigate(['/login']);
        }
      });
  }
}
