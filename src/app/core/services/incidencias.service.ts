import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Incidencia } from '../models/incidencia.model';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private base = `${environment.apiBaseUrl}/api/incidencias`;

  constructor(private http: HttpClient) {}

  listar(filters?: {
    estado?: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
    excludeEstado?: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
    zonaId?: number;
    tecnicoAsignadoId?: number;
    creadoPorId?: number;
    codigo?: string;
    page?: number;
    size?: number;
  }): Observable<Incidencia[]> {
    const params = new URLSearchParams();
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.excludeEstado) params.set('excludeEstado', filters.excludeEstado);
    if (filters?.zonaId != null) params.set('zonaId', String(filters.zonaId));
    if (filters?.tecnicoAsignadoId != null) params.set('tecnicoAsignadoId', String(filters.tecnicoAsignadoId));
    if (filters?.creadoPorId != null) params.set('creadoPorId', String(filters.creadoPorId));
    if (filters?.codigo) params.set('codigo', filters.codigo);
    if (filters?.page != null) params.set('page', String(filters.page));
    if (filters?.size != null) params.set('size', String(filters.size));
    const url = params.toString() ? `${this.base}?${params.toString()}` : this.base;
    return this.http.get<Incidencia[]>(url);
  }

  crear(payload: {
    tipoFalla: 'CAIDA_TOTAL' | 'BAJA_SENAL' | 'INTERMITENTE';
    descripcion?: string;
    antenaId: number;
    usuarioCreadorId: number;
  }): Observable<Incidencia> {
    const { usuarioCreadorId, ...body } = payload;
    const url = `${this.base}?usuarioCreadorId=${encodeURIComponent(usuarioCreadorId)}`;
    return this.http.post<Incidencia>(url, body);
  }

  getById(id: number): Observable<Incidencia> {
    return this.http.get<Incidencia>(`${this.base}/${id}`);
  }

  asignar(incidenciaId: number, payload: { tecnico_id: number }): Observable<Incidencia> {
    return this.http.put<Incidencia>(`${this.base}/${incidenciaId}/asignar`, payload);
  }

  cambiarEstado(incidenciaId: number, actorId: number, payload: { nuevoEstado: 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO'; horaInicio?: string; horaCierre?: string; }): Observable<Incidencia> {
    const url = `${this.base}/${incidenciaId}/estado?actorId=${encodeURIComponent(actorId)}`;
    return this.http.post<Incidencia>(url, payload);
  }
}
