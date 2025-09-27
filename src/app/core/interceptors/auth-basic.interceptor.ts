import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

// Interceptor funcional (Angular 17): agrega Authorization: Bearer <token> y maneja 401
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  // Agregar Bearer token si existe
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar 401: logout y redirect
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
