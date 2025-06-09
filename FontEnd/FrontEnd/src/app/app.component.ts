import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RegisterUserComponentComponent } from './register-user-component/register-user-component.component';
import { MarkAttendanceComponentComponent } from './mark-attendance-component/mark-attendance-component.component';
import { LoginComponentComponentComponent } from './login-component-component/login-component-component.component';
import { UserDashboardComponentComponent } from './user-dashboard-component/user-dashboard-component.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  
}
