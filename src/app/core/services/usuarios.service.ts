import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Usuario, RolUsuario } from '../models/usuario.model';
import { UserCreateReq, UserUpdateReq, UserPasswordReq, UserResp } from '../../features/admin/models/admin-users.dto';

// Usar UserResp como tipo único para todas las vistas de usuario
export type UserView = UserResp;

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private base = `${environment.apiBaseUrl}/api/admin/users`;

  constructor(private http: HttpClient) {}

  listar(rol?: RolUsuario, activo?: boolean): Observable<UserResp[]> {
    let params = new HttpParams();
    if (rol) params = params.set('rol', rol);
    if (activo !== undefined) params = params.set('activo', activo.toString());
    return this.http.get<UserResp[]>(this.base, { params });
  }

  crear(user: UserCreateReq): Observable<UserResp> {
    return this.http.post<UserResp>(this.base, user);
  }

  actualizar(id: number, req: UserUpdateReq): Observable<UserResp> {
    return this.http.put<UserResp>(`${this.base}/${id}`, req);
  }

  cambiarPassword(id: number, req: UserPasswordReq): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/password`, req);
  }

  // User profile method - uses /api/usuarios/me endpoint
  me(): Observable<UserResp> {
    return this.http.get<UserResp>(`${environment.apiBaseUrl}/api/usuarios/me`);
  }

}
