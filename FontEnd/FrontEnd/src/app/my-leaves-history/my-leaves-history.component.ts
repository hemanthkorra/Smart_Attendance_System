import { Component } from '@angular/core';
import { LeaveRequestHistoryItem } from '../interfaces/interfaces';
import { UserService } from '../../Services/user-service.service';
import { AuthService } from '../../Services/auth-service.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-leaves-history',
  imports: [CommonModule],
  templateUrl: './my-leaves-history.component.html',
  styleUrl: './my-leaves-history.component.css'
})
export class MyLeavesHistoryComponent {
 userId: number | null = null;
  leaves: LeaveRequestHistoryItem[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router // In case of critical errors like user ID mismatch
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();

    if (this.userId === null) {
      this.errorMessage = 'User not logged in. Please log in to view leave history.';
      this.isLoading = false;
      // Optionally redirect to login
      this.router.navigate(['/login']);
      return;
    }

    this.fetchLeaveHistory(this.userId);
  }

  fetchLeaveHistory(userId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getMyLeaveRequests(userId).subscribe({
      next: (data: LeaveRequestHistoryItem[]) => {
        this.leaves = data;
        this.isLoading = false;
        if (this.leaves.length === 0) {
          this.errorMessage = 'No leave requests found.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching leave history:', err);
        if (err.status === 404) {
          this.errorMessage = 'User not found or no leave history available.';
        } else {
          this.errorMessage = 'Failed to load leave history. Please try again.';
        }
      }
    });
  }

  // Helper function to determine badge class based on status
  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'badge bg-success';
      case 'Pending':
        return 'badge bg-warning text-dark';
      case 'Rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
