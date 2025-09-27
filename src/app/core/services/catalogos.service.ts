import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { UserResp } from '../../features/admin/models/admin-users.dto';

// Mantener TecnicoResp para compatibilidad temporal
export interface TecnicoResp {
  id: number;
  nombre: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private base = `${environment.apiBaseUrl}/api/catalogos`;

  constructor(private http: HttpClient) {}

  listarTecnicos(): Observable<UserResp[]> {
    return this.http.get<UserResp[]>(`${this.base}/tecnicos`);
  }

  listarJefes(): Observable<UserResp[]> {
    return this.http.get<UserResp[]>(`${this.base}/jefes`);
  }
}
