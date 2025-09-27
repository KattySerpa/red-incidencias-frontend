import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface PerfilResp {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private base = `${environment.apiBaseUrl}/api/perfil`;

  constructor(private http: HttpClient) {}

  me(): Observable<PerfilResp> {
    return this.http.get<PerfilResp>(`${this.base}/me`);
  }
}
