export interface Incidencia {
  id: number;
  codigo: string;
  tipoFalla: 'CAIDA_TOTAL' | 'BAJA_SENAL' | 'INTERMITENTE';
  descripcion?: string;
  estado: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
  creadoPorId?: number | null;
  tecnicoAsignadoId?: number | null;
  tecnicoAsignado?: { id: number; nombreCompleto?: string; username?: string } | null;
  antenaId?: number | null;
  antenaCodigo?: string | null;
  antenaNombre?: string | null;
  zonaFull?: string | null;
  horaInicio?: string | null; // ISO
  horaCierre?: string | null; // ISO
  creadoEn?: string | null;
  actualizadoEn?: string | null;
}
