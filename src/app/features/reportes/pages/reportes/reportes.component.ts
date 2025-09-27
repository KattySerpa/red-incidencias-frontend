import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { IncidenciasService } from '../../../../core/services/incidencias.service';
import { ZonasService } from '../../../../core/services/zonas.service';
import { UsuariosService } from '../../../../core/services/usuarios.service';
import { CatalogosService } from '../../../../core/services/catalogos.service';
import { UserResp } from '../../../admin/models/admin-users.dto';
import { Incidencia } from '../../../../core/models/incidencia.model';
import { Zona } from '../../../../core/models/zona.model';
import { SmartDateDirective } from '../../../../shared/directives/smart-date.directive';
import { AntenasService } from '../../../../core/services/antenas.service';
import { Antena } from '../../../../core/models/antena.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatTableModule, MatFormFieldModule, MatDatepickerModule, MatNativeDateModule, MatInputModule, MatButtonModule, SmartDateDirective, MatAutocompleteModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  displayedColumns = ['inicio', 'cierre', 'zona', 'tipo', 'tecnico', 'estado'];
  data: Incidencia[] = [];
  desde: Date | null = null;
  hasta: Date | null = null;
  // cards
  mttr: string | null = null;
  total: number = 0;
  activas: number = 0;
  zonasAfectadas: number = 0;

  // filtros
  zonas: Zona[] = [];
  zonaId: number | null = null;
  tiposFalla = [
    { value: 'CAIDA_TOTAL', label: 'Caída total' },
    { value: 'BAJA_SENAL', label: 'Baja señal' },
    { value: 'INTERMITENTE', label: 'Intermitente' },
  ];
  tipoFalla: 'CAIDA_TOTAL' | 'BAJA_SENAL' | 'INTERMITENTE' | '' = '';
  estados = ['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO'] as const;
  estado: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO' | '' = '';
  tecnicos: Array<{ id: number; nombreCompleto?: string; username?: string }> = [];
  tecnicoTexto: string = '';
  tecnicoAsignadoId: number | null = null;
  antenas: Antena[] = [];

  constructor(
    private http: HttpClient,
    private incSvc: IncidenciasService,
    private zonasSvc: ZonasService,
    private usuariosSvc: UsuariosService,
    private catalogosSvc: CatalogosService,
    private antenasSvc: AntenasService,
  ) {}

  ngOnInit(): void {
    // carga inicial sin filtros: backend requiere desde/hasta, usamos amplio rango por defecto (últimos 365 días)
    const hoy = new Date();
    const inicio = new Date();
    inicio.setDate(hoy.getDate() - 365);
    this.desde = inicio;
    this.hasta = hoy;
    // catálogos
    this.zonasSvc.listar().subscribe((z) => (this.zonas = z));
    this.catalogosSvc.listarTecnicos().subscribe((t: UserResp[]) => (this.tecnicos = t.map((u: UserResp) => ({ id: u.id!, nombreCompleto: u.nombre, username: u.email }))));
    this.antenasSvc.listar().subscribe((a) => (this.antenas = a));
    this.buscar();
  }

  buscar() {
    // Obtener detalle con filtros soportados por API y filtrar fechas en cliente
    const filtros: any = {};
    if (this.zonaId != null) filtros.zonaId = this.zonaId;
    if (this.estado) filtros.estado = this.estado;
    if (this.tecnicoAsignadoId != null) filtros.tecnicoAsignadoId = this.tecnicoAsignadoId;
    // Nota: tipoFalla y rango de fechas no están soportados por el endpoint; filtramos luego en cliente
    this.incSvc.listar(filtros).subscribe((rows) => {
      const { desde, hasta } = this.getLocalRange();
      let data = rows;
      // filtrar por fecha de inicio (creadoEn dentro del rango)
      if (desde || hasta) {
        data = data.filter(r => {
          const t = r.creadoEn ? new Date(r.creadoEn).getTime() : NaN;
          if (isNaN(t)) return false;
          if (desde && t < desde.getTime()) return false;
          if (hasta && t > hasta.getTime()) return false;
          return true;
        });
      }
      // filtrar por tipo de falla
      if (this.tipoFalla) {
        data = data.filter(r => r.tipoFalla === this.tipoFalla);
      }
      this.data = data;
      this.computeKpis();
    });
  }

  exportar(tipo: 'excel' | 'pdf') {
    if (tipo === 'excel') {
      this.exportarExcel();
    } else {
      this.exportarPdf();
    }
  }

  matchTecnicoId(texto: string): number | null {
    const t = (texto || '').toLowerCase().trim();
    if (!t) return null;
    const found = this.tecnicos.find(x =>
      (x.username && x.username.toLowerCase().includes(t)) ||
      (x.nombreCompleto && x.nombreCompleto.toLowerCase().includes(t))
    );
    return found ? found.id : null;
  }

  get filteredTecnicos() {
    const t = (this.tecnicoTexto || '').toLowerCase().trim();
    if (!t) return this.tecnicos.slice(0, 10);
    return this.tecnicos.filter(x => (x.nombreCompleto || '').toLowerCase().includes(t)).slice(0, 10);
  }

  getTecnicoNombre(row: Incidencia): string {
    const id = (row as any).tecnicoAsignadoId as number | undefined;
    if (!id) return '-';
    const t = this.tecnicos.find(tt => tt.id === id);
    return t?.nombreCompleto || '-';
  }

  getAntenaNombre(row: Incidencia): string {
    const a = this.antenas.find(aa => aa.id === row.antenaId);
    if (!a) return row.antenaCodigo || String(row.antenaId || '-');
    return a.nombre ? `${a.nombre} (${a.codigo})` : a.codigo;
  }

  private buildFiltros() {
    const desdeIso = this.toIsoLocalDate(this.desde || new Date());
    const hastaIso = this.toIsoLocalDate(this.hasta || new Date());
    return { desde: desdeIso, hasta: hastaIso };
  }

  private getLocalRange(): { desde: Date | null; hasta: Date | null } {
    return { desde: this.desde, hasta: this.hasta };
  }

  private toIsoLocalDate(d: Date): string {
    const copy = new Date(d);
    copy.setHours(0,0,0,0);
    const tz = copy.getTimezoneOffset() * 60000;
    return new Date(copy.getTime() - tz).toISOString();
  }

  private formatMttr(min?: number | null): string | null {
    if (min == null || min < 0) return null;
    const hours = Math.floor(min / 60);
    const minutes = Math.floor(min % 60);
    return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
  }

  private computeKpis() {
    this.total = this.data.length;
    // activas: ABIERTO o EN_PROGRESO
    this.activas = this.data.filter(d => d.estado === 'ABIERTO' || d.estado === 'EN_PROGRESO').length;
    // zonas afectadas: antenas únicas con incidencias activas
    const antenasActivas = new Set(this.data.filter(d => d.estado === 'ABIERTO' || d.estado === 'EN_PROGRESO').map(d => d.antenaId || d.antenaCodigo || '')); 
    this.zonasAfectadas = Array.from(antenasActivas).filter(v => !!v).length;
    // MTTR: promedio de (horaCierre - horaInicio) en minutos para resueltas/cerradas
    const durations: number[] = [];
    for (const d of this.data) {
      if (d.horaInicio && d.horaCierre && (d.estado === 'RESUELTO' || d.estado === 'CERRADO')) {
        const start = new Date(d.horaInicio).getTime();
        const end = new Date(d.horaCierre).getTime();
        if (end >= start) durations.push(Math.round((end - start) / 60000));
      }
    }
    const avg = durations.length ? Math.round(durations.reduce((a,b)=>a+b,0) / durations.length) : null;
    this.mttr = this.formatMttr(avg);
  }

  private buildExportRows() {
    return this.data.map(d => ({
      'Inicio': d.horaInicio ? new Date(d.horaInicio) : '',
      'Cierre': d.horaCierre ? new Date(d.horaCierre) : '',
      'Zona/Antena': d.antenaCodigo || d.antenaId || '',
      'Tipo falla': d.tipoFalla,
      'Técnico': (d as any)['tecnicoAsignado']?.nombreCompleto || '',
      'Estado': d.estado,
    }));
  }

  private async exportarExcel() {
    const { utils, writeFile } = await import('xlsx');
    const rows = this.buildExportRows();
    // hoja datos
    const ws = utils.json_to_sheet(rows, { cellDates: true });
    // aplicar formato simple de fecha
    const setFmt = (addr: string) => { const c = (ws as any)[addr]; if (c && c.t === 'd') c.z = 'dd/mm/yyyy hh:mm'; };
    // intentar formatear primeras dos columnas (Inicio/Cierre) para primeras N filas
    const range = utils.decode_range(ws['!ref'] as string);
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      setFmt(utils.encode_cell({ r, c: 0 }));
      setFmt(utils.encode_cell({ r, c: 1 }));
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Incidencias');

    // hoja resumen (cards)
    const resumen = [
      { KPI: 'MTTR', Valor: this.mttr || '' },
      { KPI: 'Total incidencias', Valor: this.total },
      { KPI: 'Incidencias activas', Valor: this.activas },
      { KPI: 'Zonas afectadas', Valor: this.zonasAfectadas },
    ];
    const ws2 = utils.json_to_sheet(resumen);
    utils.book_append_sheet(wb, ws2, 'Resumen');

    // hoja filtros aplicados
    const filtros = this.getFiltrosResumenRows();
    const ws3 = utils.aoa_to_sheet(filtros);
    utils.book_append_sheet(wb, ws3, 'Filtros');

    writeFile(wb, `reporte-incidencias.xlsx`);
  }

  private async exportarPdf() {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Reporte de Incidencias', 14, 16);
    doc.setFontSize(10);
    let y0 = 22;
    // Filtros aplicados
    const filtros = this.getFiltrosResumenStrings();
    for (const line of filtros) {
      doc.text(line, 14, y0);
      y0 += 5;
    }
    y0 += 2;
    doc.text(`MTTR: ${this.mttr || '-'}`, 14, y0);
    doc.text(`Total: ${this.total}`, 60, y0);
    doc.text(`Activas: ${this.activas}`, 100, y0);
    doc.text(`Zonas afectadas: ${this.zonasAfectadas}`, 140, y0);

    const head = [['Inicio', 'Cierre', 'Zona/Antena', 'Tipo falla', 'Técnico', 'Estado']];
    const body = this.data.map(d => [
      d.horaInicio ? new Date(d.horaInicio).toLocaleString('es-PE') : '-',
      d.horaCierre ? new Date(d.horaCierre).toLocaleString('es-PE') : '-',
      d.antenaCodigo || String(d.antenaId || ''),
      d.tipoFalla,
      (d as any)['tecnicoAsignado']?.nombreCompleto || '-',
      d.estado,
    ]);
    autoTable(doc, {
      head,
      body,
      startY: y0 + 6,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 243] },
      margin: { left: 12, right: 12 },
    });

    doc.save('reporte-incidencias.pdf');
  }

  private getFiltrosResumenRows(): any[][] {
    const zona = this.zonas.find(z => z.id === this.zonaId);
    const zonaTxt = zona ? `${zona.departamento}${zona.provincia ? ' / ' + zona.provincia : ''}${zona.distrito ? ' / ' + zona.distrito : ''}` : 'Todas';
    const tipoTxt = this.tipoFalla ? this.tiposFalla.find(t => t.value === this.tipoFalla)?.label || this.tipoFalla : 'Todos';
    const estTxt = this.estado || 'Todos';
    const tecTxt = this.tecnicoTexto || 'Todos';
    return [
      ['Desde', this.formatDate(this.desde)],
      ['Hasta', this.formatDate(this.hasta)],
      ['Zona', zonaTxt],
      ['Tipo de falla', tipoTxt],
      ['Estado', estTxt],
      ['Técnico', tecTxt],
    ];
  }

  private getFiltrosResumenStrings(): string[] {
    const rows = this.getFiltrosResumenRows();
    return rows.map(([k, v]) => `${k}: ${v ?? ''}`);
  }

  private formatDate(d: Date | null): string {
    if (!d) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }
}
