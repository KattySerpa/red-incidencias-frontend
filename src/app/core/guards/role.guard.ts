import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const rolesPermitidos: string[] = (route.data?.['roles'] as string[]) || [];

  // Verificar autenticación primero
  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Si no se especifican roles, solo requiere autenticación
  if (rolesPermitidos.length === 0) {
    return true;
  }

  // Obtener roles del JWT (ya normalizados)
  const userRoles = authService.getRoles();
  
  // Verificar intersección de roles
  const hasPermission = rolesPermitidos.some(role => userRoles.includes(role));
  
  if (hasPermission) {
    return true;
  }

  // Sin permisos: redirigir a página por defecto
  router.navigate(['/incidencias']);
  return false;
};
