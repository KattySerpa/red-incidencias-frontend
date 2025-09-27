export interface BitacoraEntry {
  id: number;
  accion: string;
  detalle?: string | null;
  fecha: string; // ISO
  usuario?: { id: number; username?: string; nombreCompleto?: string } | any;
}
