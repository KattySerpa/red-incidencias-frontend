import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { UsuariosService, UserView } from './usuarios.service';
import { UserResp } from '../../features/admin/models/admin-users.dto';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private _me$ = new BehaviorSubject<UserResp | null>(null);
  readonly me$ = this._me$.asObservable();
  private loaded = false;

  constructor(private usuariosService: UsuariosService) {}

  loadMe(force = false) {
    if (this.loaded && !force) return;
    this.usuariosService
      .me()
      .pipe(
        tap(() => (this.loaded = true)),
        catchError(() => {
          this.loaded = true;
          return of(null);
        })
      )
      .subscribe((me: UserResp | null) => this._me$.next(me));
  }

  clear() {
    this.loaded = false;
    this._me$.next(null);
  }
}
