import { Component, OnInit } from '@angular/core';
import { EditUserRequest, UpdatePasswordRequest, User } from '../interfaces/interfaces';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../Services/admin-service.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manage-users',
  imports: [ ReactiveFormsModule, CommonModule,FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css'
})
export class ManageUsersComponent implements OnInit { // Implemented OnInit
    users: User[] = []; // All users fetched from the API
    filteredUsers: User[] = []; // Users after applying search filters
    paginatedUsers: User[] = []; // Users for the current page (used in list view)

    selectedUser: User | null = null;
    isEditing: boolean = false;
    isUpdatingPassword: boolean = false;

    // Filtering and Pagination properties
    searchTerm: string = '';
    recordsPerPage: number = 10; // Default records per page for list view
    currentPage: number = 1;
    searchTimeout: any; // For debouncing the search input

    // Single Record View properties
    singleRecordViewActive: boolean = false;
    currentSingleRecordIndex: number = 0; // Index for the user in single record view

    // Reactive Forms
    editForm!: FormGroup;
    updatePasswordForm!: FormGroup;

    errorMessage: string | null = null;
    successMessage: string | null = null;
    isLoading: boolean = false; // For initial data load of the table
    isProcessingAction: boolean = false; // For edit, update password, delete actions

    constructor(private adminService: AdminService, private fb: FormBuilder, private router: Router) { }

    ngOnInit(): void {
        this.loadUsers();
        this.initForms();
    }

    /**
     * Initializes the reactive forms for editing user details and updating passwords.
     */
    initForms(): void {
        this.editForm = this.fb.group({
            employeeId: ['', Validators.required],
            username: ['', Validators.required],
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            department: [''],
            role: ['', Validators.required],
        });

        this.updatePasswordForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    /**
     * Loads all users from the admin service.
     * After loading, it triggers filtering and pagination.
     */
    loadUsers(): void {
        this.isLoading = true; // Start loading for initial table data
        this.adminService.getAllUsers().subscribe({
            next: (data) => {
                this.users = data;
                this.filterAndPaginateUsers(); // Filter and paginate after loading all users
                this.clearMessages();
                this.isLoading = false; // End loading
            },
            error: (err) => {
                this.errorMessage = this.extractErrorMessage(err, 'Failed to load users');
                this.users = []; // Clear users on error
                this.filterAndPaginateUsers(); // Update filtered/paginated users even on error
                this.isLoading = false; // End loading
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
     * Handles changes in the search term with a debounce.
     * This prevents excessive filtering calls while the user is typing.
     */
    onSearchTermChange(): void {
        clearTimeout(this.searchTimeout); // Clear previous timeout
        this.searchTimeout = setTimeout(() => {
            this.filterAndPaginateUsers(); // Trigger filter and paginate after delay
        }, 300); // 300ms delay
    }

    /**
     * Handles changes in the "records per page" dropdown.
     */
    onRecordsPerPageChange(): void {
        this.currentPage = 1; // Reset to first page when records per page changes
        this.applyPagination();
    }

    /**
     * Filters the users based on the search term (Employee ID or Department)
     * and then applies pagination. Also updates single record index.
     */
    filterAndPaginateUsers(): void {
        const term = this.searchTerm.toLowerCase().trim();

        if (!term) {
            this.filteredUsers = [...this.users]; // If no search term, show all users
        } else {
            this.filteredUsers = this.users.filter(user =>
                (user.employeeId && user.employeeId.toLowerCase().includes(term)) ||
                (user.department && user.department.toLowerCase().includes(term))
            );
        }
        this.currentPage = 1; // Always reset to the first page after filtering
        this.applyPagination(); // Apply pagination for the list view

        // Ensure currentSingleRecordIndex is valid after filtering
        if (this.currentSingleRecordIndex >= this.filteredUsers.length) {
            this.currentSingleRecordIndex = Math.max(0, this.filteredUsers.length - 1);
        }
    }

    /**
     * Applies pagination to the filtered users and updates the paginatedUsers array.
     */
    applyPagination(): void {
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
    }

    /**
     * Calculates the total number of pages based on filtered users and records per page.
     * @returns The total number of pages.
     */
    getTotalPages(): number {
        return Math.ceil(this.filteredUsers.length / this.recordsPerPage);
    }

    /**
     * Generates an array of page numbers for pagination controls.
     * @returns An array of page numbers.
     */
    getPagesArray(): number[] {
        const totalPages = this.getTotalPages();
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    /**
     * Navigates to a specific page.
     * @param page The page number to navigate to.
     */
    goToPage(page: number): void {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.applyPagination();
        }
    }

    /**
     * Navigates to the previous page.
     */
    prevPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    /**
     * Navigates to the next page.
     */
    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    /**
     * Toggles between list view and single record view.
     */
    toggleSingleRecordView(): void {
        this.singleRecordViewActive = !this.singleRecordViewActive;
        if (this.singleRecordViewActive) {
            this.currentSingleRecordIndex = 0;
        } else {
            this.applyPagination();
        }
        this.clearMessages(); // Clear messages on view change
    }

    /**
     * Navigates to the previous record in single record view.
     */
    prevSingleRecord(): void {
        if (this.currentSingleRecordIndex > 0) {
            this.currentSingleRecordIndex--;
        }
    }

    /**
     * Navigates to the next record in single record view.
     */
    nextSingleRecord(): void {
        if (this.currentSingleRecordIndex < this.filteredUsers.length - 1) {
            this.currentSingleRecordIndex++;
        }
    }

    /**
     * Opens the edit user form, populating it with the selected user's data.
     * @param user The user object to be edited.
     */
    openEditForm(user: User): void {
        this.selectedUser = { ...user }; // Create a copy to avoid direct mutation
        this.editForm.patchValue({ // Populate the edit form with user data
            employeeId: user.employeeId || '',
            username: user.username || '',
            fullName: user.fullName || '',
            email: user.email || '',
            department: user.department || '',
            role: user.role || '',
        });
        this.isEditing = true;
        this.isUpdatingPassword = false; // Close password form if open
        this.clearMessages(); // Clear messages when opening a new form
        this.isProcessingAction = false; // Ensure action spinner is off
    }

    /**
     * Submits the edited user data to the admin service.
     */
    editUser(): void {
        if (!this.selectedUser?.id) {
            this.errorMessage = 'No user selected for editing.';
            return;
        }
        this.clearMessages();
        if (this.editForm.invalid) {
            this.errorMessage = 'Please correct the form errors.';
            this.markFormGroupTouched(this.editForm); // Mark controls as touched to show validation errors
            return;
        }

        const updatedEmployeeId = this.editForm.get('employeeId')?.value;
        // Check for duplicate employee ID, excluding the currently selected user
        const isDuplicate = this.users.some(user =>
            user.employeeId === updatedEmployeeId && user.id !== this.selectedUser?.id
        );

        if (isDuplicate) {
            this.errorMessage = 'Employee ID already exists for another user. Please use a unique Employee ID.';
            return; // Stop the edit process
        }

        const updatedData: EditUserRequest = this.editForm.value;
        this.isProcessingAction = true; // Start processing spinner for edit

        this.adminService.editUser(this.selectedUser.id, updatedData).subscribe({
            next: (response) => {
                this.successMessage = (typeof response === 'string' ? response : 'User updated successfully!');
                this.isProcessingAction = false; // End processing spinner
                setTimeout(() => {
                    this.loadUsers(); // Reload users to reflect changes (will re-filter and paginate)
                    this.isEditing = false; // Close the edit form after delay
                    this.selectedUser = null; // Clear selected user after delay
                    this.clearMessages(); // Clear success message after form closes
                }, 2000); // 2-second delay
            },
            error: (err) => {
                this.isProcessingAction = false; // End processing spinner
                this.errorMessage = this.extractErrorMessage(err, 'Update failed');
            }
        });
    }

    /**
     * Opens the update password form for the selected user.
     * @param user The user object for whom the password will be updated.
     */
    openUpdatePasswordForm(user: User): void {
        this.selectedUser = user;
        this.updatePasswordForm.reset({ newPassword: '' }); // Reset password field
        this.isUpdatingPassword = true;
        this.isEditing = false; // Close edit form if open
        this.clearMessages(); // Clear messages when opening a new form
        this.isProcessingAction = false; // Ensure action spinner is off
    }

    /**
     * Submits the new password for the selected user to the admin service.
     */
    updatePassword(): void {
        if (!this.selectedUser?.id) {
            this.errorMessage = 'No user selected for password update.';
            return;
        }
        this.clearMessages();
        if (this.updatePasswordForm.invalid) {
            this.errorMessage = 'New password is required and must be at least 6 characters.';
            this.markFormGroupTouched(this.updatePasswordForm); // Mark controls as touched
            return;
        }

        const request: UpdatePasswordRequest = this.updatePasswordForm.value;
        this.isProcessingAction = true; // Start processing spinner for update password

        this.adminService.updateUserPassword(this.selectedUser.id, request).subscribe({
            next: (response) => {
                this.successMessage = (typeof response === 'string' ? response : 'Password updated successfully!');
                this.isProcessingAction = false; // End processing spinner
                setTimeout(() => {
                    this.loadUsers(); // Reload users (optional, but good for consistency)
                    this.isUpdatingPassword = false; // Close the password form after delay
                    this.selectedUser = null; // Clear selected user after delay
                    this.clearMessages(); // Clear success message after form closes
                }, 2000); // 2-second delay
            },
            error: (err) => {
                this.isProcessingAction = false; // End processing spinner
                this.errorMessage = this.extractErrorMessage(err, 'Password update failed');
            }
        });
    }

    /**
     * Deletes a user after confirmation.
     * @param id The ID of the user to delete.
     */
    deleteUser(id: number): void {
        // Using a simple confirm. In a real app, consider a custom modal for better UX.
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            this.clearMessages();
            this.isProcessingAction = true; // Start processing spinner for delete
            this.adminService.deleteUser(id).subscribe({
                next: (response) => {
                    this.successMessage = (typeof response === 'string' ? response : 'User deleted successfully!');
                    this.isProcessingAction = false; // End processing spinner
                    this.loadUsers(); // Reload users to update the table (will re-filter and paginate)
                },
                error: (err) => {
                    this.isProcessingAction = false; // End processing spinner
                    this.errorMessage = this.extractErrorMessage(err, 'Delete failed');
                }
            });
        }
    }

    /**
     * Navigates to the attendance report for a specific user.
     * @param userId The ID of the user whose report is to be viewed.
     */
    viewUserReport(userId: number): void {
      this.router.navigate(['/admin/user-attendance-report', userId]);
      this.clearMessages(); // Clear any messages before navigating
    }

    /**
     * Cancels any active form (edit or update password) and clears selected user.
     */
    cancelForm(): void {
        this.isEditing = false;
        this.isUpdatingPassword = false;
        this.selectedUser = null;
        this.clearMessages();
        this.isProcessingAction = false; // Ensure action spinner is off
    }

    /**
     * Helper function to mark all controls in a FormGroup as touched.
     * This is useful for immediately showing validation errors on submit.
     * @param formGroup The FormGroup to mark as touched.
     */
    private markFormGroupTouched(formGroup: FormGroup) {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if ((control as any).controls) { // Check for nested FormGroups
                this.markFormGroupTouched(control as FormGroup);
            }
        });
    }

    /**
     * Extracts a user-friendly error message from an HTTP error response.
     * This handles cases where the backend might return plain text instead of JSON.
     * @param err The HTTP error object.
     * @param defaultMessage A default message to use if a specific error cannot be extracted.
     * @returns A string containing the error message.
     */
    private extractErrorMessage(err: any, defaultMessage: string = 'An unknown error occurred'): string {
        let message = '';
        if (err.error) {
            if (typeof err.error === 'string') {
                // If err.error is a string, it might be the direct error message or an HTML string.
                // Try to parse it as JSON first, if it fails, use it as plain text.
                try {
                    const parsedError = JSON.parse(err.error);
                    message = parsedError.error || parsedError.message || err.error;
                } catch (e) {
                    message = err.error; // It's a plain string, use it directly
                }
            } else if (err.error.message) {
                // If err.error is an object with a 'message' property
                message = err.error.message;
            } else if (err.error.error) {
                // If err.error is an object with an 'error' property (common for API errors)
                message = err.error.error;
            } else {
                // Fallback for other object structures
                message = JSON.stringify(err.error);
            }
        } else if (err.message) {
            // Fallback to the generic Angular error message
            message = err.message;
        } else {
            message = 'No specific error message provided.';
        }
        return `${defaultMessage}: ${message}`;
    }
}