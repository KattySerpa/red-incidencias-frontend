import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Antena } from '../models/antena.model';

@Injectable({ providedIn: 'root' })
export class AntenasService {
  private base = `${environment.apiBaseUrl}/api/antenas`;
  constructor(private http: HttpClient) {}

  listar(): Observable<Antena[]> {
    return this.http.get<Antena[]>(this.base);
  }
}
