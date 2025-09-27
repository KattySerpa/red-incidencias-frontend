import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'red-incidencias-frontend';

  constructor(public auth: AuthService, private router: Router) {}

  // Métodos para el template del menú
  hasRole(role: string): boolean {
    return this.auth.getRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.auth.getRoles();
    return roles.some(role => userRoles.includes(role));
  }

  getCurrentUserEmail(): string {
    const token = this.auth.getToken();
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.email || '';
    } catch {
      return '';
    }
  }

  onLogout() {
    this.auth.logout();
  }
}
