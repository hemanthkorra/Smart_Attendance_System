import { Component } from '@angular/core';
import { LeaveRequest } from '../interfaces/interfaces';
import { AdminService } from '../../Services/admin-service.service';
import { CommonModule, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-view-leave-requests',
  imports: [DatePipe, CommonModule],
  templateUrl: './view-leave-requests.component.html',
  styleUrl: './view-leave-requests.component.css'
})
export class ViewLeaveRequestsComponent {
 leaveRequests: LeaveRequest[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = true; // For initial data loading
  isApproving: boolean = false; // For approve button spinner
  isRejecting: boolean = false; // For reject button spinner
  currentActionId: number | null = null; // To track which request is being processed

  // For custom confirmation modal
  showConfirmModal: boolean = false;
  confirmTitle: string = '';
  confirmMessage: string = '';
  confirmAction: (() => void) | null = null; // Function to execute on confirm

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadLeaveRequests();
  }

  /**
   * Loads all leave requests from the admin service.
   */
  loadLeaveRequests(): void {
    this.isLoading = true;
    this.clearMessages(); // Clear messages before loading
    this.adminService.getAllLeaveRequests().pipe(
      finalize(() => this.isLoading = false) // Stop loading regardless of success/error
    ).subscribe({
      next: (data) => {
        this.leaveRequests = data;
      },
      error: (err) => {
        console.error('Error loading leave requests:', err);
        this.errorMessage = 'Failed to load leave requests: ' + (err.error?.error || err.message);
      }
    });
  }

  /**
   * Clears any displayed error or success messages.
   */
  clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }

  /**
   * Opens the custom confirmation modal.
   * @param id The ID of the leave request.
   * @param actionType 'approve' or 'reject'.
   */
  openConfirmModal(id: number, actionType: 'approve' | 'reject'): void {
    this.currentActionId = id; // Set the ID of the request being acted upon
    if (actionType === 'approve') {
      this.confirmTitle = 'Approve Leave Request';
      this.confirmMessage = 'Are you sure you want to approve this leave request?';
      this.confirmAction = () => this.performApproveLeave(id);
    } else {
      this.confirmTitle = 'Reject Leave Request';
      this.confirmMessage = 'Are you sure you want to reject this leave request?';
      this.confirmAction = () => this.performRejectLeave(id);
    }
    this.showConfirmModal = true;
  }

  /**
   * Closes the custom confirmation modal and resets action state.
   */
  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmAction = null;
    this.currentActionId = null; // Clear the action ID
  }

  /**
   * Executes the confirmed action (approve or reject).
   */
  executeConfirmAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.closeConfirmModal(); // Close modal after action is triggered
  }

  /**
   * Performs the actual approval of a leave request.
   * @param id The ID of the leave request to approve.
   */
  performApproveLeave(id: number): void {
    this.clearMessages();
    this.isApproving = true; // Start spinner for approve
    this.adminService.approveLeave(id).pipe(
      finalize(() => {
        this.isApproving = false; // Stop spinner
        this.currentActionId = null; // Clear action ID
      })
    ).subscribe({
      next: (response) => {
        this.successMessage = response || 'Leave request approved successfully.';
        this.loadLeaveRequests(); // Refresh the list
        setTimeout(() => this.clearMessages(), 3000); // Clear success message after 3 seconds
      },
      error: (err) => {
        console.error('Error approving leave:', err);
        this.errorMessage = 'Failed to approve leave: ' + (err.error?.error || err.message);
        setTimeout(() => this.clearMessages(), 5000); // Clear error message after 5 seconds
      }
    });
  }

  /**
   * Performs the actual rejection of a leave request.
   * @param id The ID of the leave request to reject.
   */
  performRejectLeave(id: number): void {
    this.clearMessages();
    this.isRejecting = true; // Start spinner for reject
    this.adminService.rejectLeave(id).pipe(
      finalize(() => {
        this.isRejecting = false; // Stop spinner
        this.currentActionId = null; // Clear action ID
      })
    ).subscribe({
      next: (response) => {
        this.successMessage = response || 'Leave request rejected successfully.';
        this.loadLeaveRequests(); // Refresh the list
        setTimeout(() => this.clearMessages(), 3000); // Clear success message after 3 seconds
      },
      error: (err) => {
        console.error('Error rejecting leave:', err);
        this.errorMessage = 'Failed to reject leave: ' + (err.error?.error || err.message);
        setTimeout(() => this.clearMessages(), 5000); // Clear error message after 5 seconds
      }
    });
  }
}
