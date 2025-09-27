import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap, catchError, throwError } from 'rxjs';

interface LoginResponse {
  access_token: string;
  expires_in: number;
  email: string;
  roles: string[];
}

interface MustChangePasswordResponse {
  mustChangePassword: boolean;
}

interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly TOKEN_KEY = 'auth_token';
  private readonly API_URL = 'http://localhost:8080/auth';

  login(email: string, password: string): Observable<boolean | { mustChangePassword: boolean; email: string }> {
    return this.http
      .post<LoginResponse | MustChangePasswordResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap((response) => {
          // Solo guardar token si es LoginResponse normal
          if ('access_token' in response) {
            localStorage.setItem(this.TOKEN_KEY, response.access_token);
          }
        }),
        map((response) => {
          if ('mustChangePassword' in response) {
            return { mustChangePassword: true, email };
          }
          return true;
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    
    try {
      const payload = this.decodeJwt<JwtPayload>(token);
      return this.normalizeRoles(payload.roles || []);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return [];
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeJwt<JwtPayload>(token);
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  changePassword(email: string, oldPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/change-password`, {
      email,
      oldPassword,
      newPassword
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  private decodeJwt<T = any>(token: string): T {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  private normalizeRoles(roles: string[]): string[] {
    return roles.map(role => {
      // Normalizar JEFE_OPERACIONES → ROLE_JEFE
      if (['JEFE_OPERACIONES', 'ROLE_JEFE_OPERACIONES'].includes(role)) {
        return 'ROLE_JEFE';
      }
      // Asegurar prefijo ROLE_
      return role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    });
  }

  // Método de compatibilidad para componentes existentes
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }
}
