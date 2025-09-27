import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Zona } from '../models/zona.model';

@Injectable({ providedIn: 'root' })
export class ZonasService {
  private base = `${environment.apiBaseUrl}/api/zonas`;
  constructor(private http: HttpClient) {}

  listar(): Observable<Zona[]> {
    return this.http.get<Zona[]>(this.base);
  }
}
