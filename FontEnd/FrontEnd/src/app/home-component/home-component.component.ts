import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-component',
  imports: [],
  templateUrl: './home-component.component.html',
  styleUrl: './home-component.component.css'
})
export class HomeComponentComponent {
 constructor(private router: Router) { }

  // Simplified to navigate directly to paths
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
