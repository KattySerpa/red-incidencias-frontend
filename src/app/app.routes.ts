import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { CambiarPasswordComponent } from './features/auth/pages/cambiar-password/cambiar-password.component';
import { IncidenciasListaComponent } from './features/incidencias/pages/lista/lista.component';
import { authGuard } from './core/guards/auth.guard';
import { IncidenciaCrearComponent } from './features/incidencias/pages/crear/crear.component';
import { IncidenciaDetalleComponent } from './features/incidencias/pages/detalle/detalle.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'cambiar-password', component: CambiarPasswordComponent },
  { path: 'incidencias', component: IncidenciasListaComponent, canActivate: [authGuard] },
  { path: 'incidencias/crear', component: IncidenciaCrearComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_TECNICO'] } },
  { path: 'incidencias/:id', component: IncidenciaDetalleComponent, canActivate: [authGuard] },
  { path: 'reportes', canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_JEFE'] }, loadComponent: () => import('./features/reportes/pages/reportes/reportes.component').then(m => m.ReportesComponent) },
  { path: 'admin/usuarios', canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] }, loadComponent: () => import('./features/admin/pages/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
  { path: '**', redirectTo: 'login' }
];
