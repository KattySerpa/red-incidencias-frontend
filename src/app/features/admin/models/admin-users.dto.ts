export type RolUsuario = 'ADMIN' | 'JEFE' | 'TECNICO';

export interface UserCreateReq {
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  password: string;
}

export interface UserUpdateReq {
  nombre?: string;
  rol?: RolUsuario;
  activo?: boolean;
}

export interface UserPasswordReq {
  password: string;
}

export interface UserResp {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
}
