import { Component } from '@angular/core';
import { AuthService } from '../../Services/auth-service.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard-component',
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './admin-dashboard-component.component.html',
  styleUrl: './admin-dashboard-component.component.css'
})
export class AdminDashboardComponentComponent {
adminName: string | null = null;

  constructor(private authService: AuthService, private router: Router) {
    const user = this.authService.getCurrentUser();
    if (user && user.fullName) {
      this.adminName = user.fullName;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin-login']);
  }
}
