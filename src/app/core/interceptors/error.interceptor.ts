import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../../shared/components/error-dialog/error-dialog.component';
import { catchError, throwError } from 'rxjs';

function extractMessages(error: any): string[] {
  if (!error) return ['Ocurrió un error inesperado'];
  // Backend formato conocido { errors: { field: message }, message?: string }
  const msgs: string[] = [];
  if (error.errors && typeof error.errors === 'object') {
    for (const [k, v] of Object.entries(error.errors)) {
      msgs.push(`${k}: ${v}`);
    }
  }
  if (error.message && typeof error.message === 'string') {
    // Evitar duplicados si ya fue incluido
    if (!msgs.includes(error.message)) msgs.push(error.message);
  }
  if (!msgs.length) {
    // fallback: stringify
    try {
      msgs.push(JSON.stringify(error));
    } catch {
      msgs.push('Error desconocido');
    }
  }
  return msgs;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const dialog = inject(MatDialog);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Solo mostrar para 4xx/5xx
      if (err.status >= 400) {
        const messages = extractMessages(err.error);
        dialog.open(ErrorDialogComponent, {
          data: {
            title: err.status >= 500 ? 'Error del servidor' : 'Error de validación',
            messages,
            status: err.status,
            timestamp: (err.error && err.error.timestamp) || undefined,
          },
          width: '480px'
        });
      }
      return throwError(() => err);
    })
  );
};
