import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth-service.service'; // Adjust path

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const authenticatedUser = authService.getCurrentUser();

  console.log('--- AuthGuard Check ---');
  console.log('Attempting to activate route:', state.url);
  console.log('isAuthenticated():', isAuthenticated);
  console.log('authenticatedUser from AuthService:', authenticatedUser);

  if (isAuthenticated && authenticatedUser) {
    // Check for admin routes
    if (state.url.startsWith('/admin')) {
      if (authenticatedUser.role === 'Admin') {
        console.log('AuthGuard: Admin user authenticated. Allowing access to admin dashboard.');
        return true;
      } else {
        console.warn('AuthGuard: User is not an Admin. Redirecting to user dashboard.');
        router.navigate(['/user', authenticatedUser.id]);
        return false;
      }
    }

    // Check for user routes (existing logic)
    if (state.url.startsWith('/user')) {
      const routeUserId = route.paramMap.get('userId');
      console.log('Route userId parameter:', routeUserId);

      if (routeUserId && authenticatedUser.id !== undefined && +routeUserId === authenticatedUser.id) {
        console.log('AuthGuard: User authenticated and ID matches route. Allowing access to user dashboard.');
        return true;
      } else {
        console.warn('AuthGuard: User authenticated but ID mismatch or route ID missing. Redirecting to login or correct user dashboard.');
        if (authenticatedUser.id) {
          router.navigate(['/user', authenticatedUser.id]); // Redirect to their own dashboard
        } else {
          router.navigate(['/login']);
        }
        return false;
      }
    }
    // If the route is neither /admin nor /user, and they are authenticated, allow it (e.g., if you have a public authenticated route later)
    console.log('AuthGuard: User authenticated and route is not specific user/admin. Allowing access.');
    return true;

  } else {
    console.warn('AuthGuard: User NOT authenticated. Redirecting to login.');
    router.navigate(['/login']);
    return false;
  }
};