import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Evidencia {
  id: number;
  urlArchivo: string;
  nombreArchivo?: string;
  contentType?: string;
  sizeBytes?: number;
  comentario?: string;
  subidoEn?: string;
}

@Injectable({ providedIn: 'root' })
export class EvidenciasService {
  private base = `${environment.apiBaseUrl}/api/incidencias`;

  constructor(private http: HttpClient) {}

  listar(incidenciaId: number): Observable<Evidencia[]> {
    return this.http.get<Evidencia[]>(`${this.base}/${incidenciaId}/evidencias`);
  }

  subir(incidenciaId: number, usuarioId: number, file: File, comentario?: string): Observable<Evidencia> {
    const form = new FormData();
    form.append('usuarioId', String(usuarioId));
    form.append('file', file);
    if (comentario) form.append('comentario', comentario);
    return this.http.post<Evidencia>(`${this.base}/${incidenciaId}/evidencias`, form);
  }
}
