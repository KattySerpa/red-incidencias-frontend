import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { BitacoraEntry } from '../models/bitacora.model';

@Injectable({ providedIn: 'root' })
export class BitacoraService {
  private base = `${environment.apiBaseUrl}/api/bitacora`;

  constructor(private http: HttpClient) {}

  porIncidencia(incidenciaId: number): Observable<BitacoraEntry[]> {
    return this.http.get<BitacoraEntry[]>(`${this.base}/incidencia/${incidenciaId}`);
  }
}
