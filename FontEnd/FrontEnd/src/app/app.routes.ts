import { Routes } from '@angular/router';
import { LoginComponentComponentComponent } from './login-component-component/login-component-component.component';
import { UserDashboardComponentComponent } from './user-dashboard-component/user-dashboard-component.component';
import { AuthGuard } from '../Authgaurd/auth.guard';
import { LeaveRequestComponentComponent } from './leave-request-component/leave-request-component.component';
import { ProfileComponent } from './profile/profile.component';
import { MyLeavesHistoryComponent } from './my-leaves-history/my-leaves-history.component';
import { AttendanceReportComponentComponent } from './attendance-report-component/attendance-report-component.component';
import { AdminDashboardComponentComponent } from './admin-dashboard-component/admin-dashboard-component.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { RegisterUserComponentComponent } from './register-user-component/register-user-component.component';
import { ViewLeaveRequestsComponent } from './view-leave-requests/view-leave-requests.component';
import { ViewAllAttendanceComponent } from './view-all-attendance/view-all-attendance.component';
import { HomeComponentComponent } from './home-component/home-component.component';
import { MarkAttendanceComponentComponent } from './mark-attendance-component/mark-attendance-component.component';
import { AdminLoginComponentComponent } from './admin-login-component/admin-login-component.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponentComponent
  },
  {
    path: 'login', // This is now primarily for employee login
    component: LoginComponentComponentComponent
  },
  {
    path: 'admin-login', // NEW ROUTE FOR ADMIN LOGIN
    component: AdminLoginComponentComponent
  },
  {
    path: 'mark-attendance',
    component: MarkAttendanceComponentComponent
  },
  {
    path: 'user/:userId',
    component: UserDashboardComponentComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileComponent },
      { path: 'leave-request', component: LeaveRequestComponentComponent },
      { path: 'attendance-report', component: AttendanceReportComponentComponent },
      { path: 'leaves-history', component: MyLeavesHistoryComponent },
    ]
  },
  {
    path: 'admin',
    component: AdminDashboardComponentComponent,
    canActivate: [AuthGuard], // AuthGuard will check for 'Admin' role here
    children: [
      { path: '', redirectTo: 'manage-users', pathMatch: 'full' },
      { path: 'manage-users', component: ManageUsersComponent },
      { path: 'register-user', component: RegisterUserComponentComponent },
      { path: 'leave-requests', component: ViewLeaveRequestsComponent },
      { path: 'attendance-report', component: ViewAllAttendanceComponent },
      // New route for single user attendance report (admin can navigate here to view a specific user's report)
      // Note: This route will likely be navigated to programmatically from a user selection page,
      // or directly if the admin knows the user ID.
      { path: 'user-attendance-report/:id', component: AttendanceReportComponentComponent },
      // Optional: Add a component here if you need a page for the admin to *select* a user first.
      // { path: 'select-user-for-report', component: SelectUserForReportComponent },
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
]

