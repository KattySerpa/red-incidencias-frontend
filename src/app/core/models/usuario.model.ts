export type RolUsuario = 'ADMIN' | 'JEFE_OPERACIONES' | 'TECNICO' | 'VISOR';
export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: RolUsuario;
  activo: boolean;
}
