import { Component, NgModule } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../Services/user-service.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Services/auth-service.service';
import { LoginResponse, User } from '../interfaces/interfaces';

@Component({
  selector: 'app-user-dashboard-component',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './user-dashboard-component.component.html',
  styleUrl: './user-dashboard-component.component.css'
})
export class UserDashboardComponentComponent {
   userId: number | null = null;
  loggedInUserName: string | null = null; // Property for the welcome message

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    console.log('UserDashboardComponentComponent: ngOnInit started.');

    // Retrieve full user object from localStorage via AuthService
    const currentUserString = localStorage.getItem('currentUser');
    if (currentUserString) {
      try {
        const currentUser: LoginResponse = JSON.parse(currentUserString); // Parse it here
        this.loggedInUserName = currentUser.fullName || null;
      } catch (e) {
        console.error('UserDashboardComponentComponent: Error parsing currentUser from localStorage for full name:', e);
        this.loggedInUserName = 'User'; // Fallback
      }
    } else {
      this.loggedInUserName = 'User'; // Fallback if no user in localStorage
    }

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('userId');
      const authenticatedUserId = this.authService.getCurrentUserId();

      console.log('UserDashboardComponentComponent: Route param userId:', idParam);
      console.log('UserDashboardComponentComponent: Authenticated userId from service:', authenticatedUserId);

      if (idParam && authenticatedUserId !== null && +idParam === authenticatedUserId) {
        this.userId = +idParam;
        console.log('UserDashboardComponentComponent: User ID matched. Dashboard layout loaded.');
      } else {
        console.error('UserDashboardComponentComponent: Mismatch or not authenticated after guard. Redirecting.', { routeId: idParam, authId: authenticatedUserId });
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  private userIdFromAuthMatchesRoute(routeId: string, authId: number | null): boolean {
    return authId !== null && +routeId === authId;
  }

  navigateTo(path: string): void {
    console.log('UserDashboardComponentComponent: navigateTo called with path:', path);
    console.log('UserDashboardComponentComponent: Current userId for navigation:', this.userId);

    if (this.userId) {
      this.router.navigate([`/user/${this.userId}/${path}`]);
    } else {
      console.warn('UserDashboardComponentComponent: Cannot navigate: User ID is null. Redirecting to login.');
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    console.log('UserDashboardComponentComponent: Logout button clicked.');
    this.authService.logout();
    console.log('UserDashboardComponentComponent: Redirecting to login after logout.');
    this.router.navigate(['/login']);
  }
}