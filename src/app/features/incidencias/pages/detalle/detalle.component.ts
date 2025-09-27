import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IncidenciasService } from '../../../../core/services/incidencias.service';
import { Incidencia } from '../../../../core/models/incidencia.model';
import { EvidenciasService, Evidencia } from '../../../../core/services/evidencias.service';
import { BitacoraService } from '../../../../core/services/bitacora.service';
import { BitacoraEntry } from '../../../../core/models/bitacora.model';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SmartDateDirective } from '../../../../shared/directives/smart-date.directive';
import { MatCardModule } from '@angular/material/card';
import { UsuariosService, UserView } from '../../../../core/services/usuarios.service';
import { CatalogosService, TecnicoResp } from '../../../../core/services/catalogos.service';
import { UserResp } from '../../../admin/models/admin-users.dto';
import { Usuario } from '../../../../core/models/usuario.model';
import { UserStoreService } from '../../../../core/services/user-store.service';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-incidencia-detalle',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    SmartDateDirective,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'DD/MM/YYYY',
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
  templateUrl: './detalle.component.html',
  styleUrls: ['./detalle.component.scss']
})
export class IncidenciaDetalleComponent implements OnInit {
  id!: number;
  incidencia?: Incidencia;
  evidencias: Evidencia[] = [];
  bitacora: BitacoraEntry[] = [];
  displayedColumns: string[] = ['nro', 'codigo', 'estado', 'fechaCreacion', 'fechaInicio', 'fechaCierre'];
  sortedBitacora: any[] = [];
  loading = false;
  error: string | null = null;

  tecnicos: UserResp[] = [];
  jefes: UserResp[] = [];

  asignarForm = this.fb.group({
    jefeId: [null as number | null],
    tecnicoId: [null as unknown as number, Validators.required],
  });

  estadoForm = this.fb.group({
    actorId: [3, Validators.required], // por ahora fijo (tecnico)
    nuevoEstado: ['RESUELTO', Validators.required],
    resolved: [false, Validators.requiredTrue],
    horaInicioFecha: [null as Date | null],
    horaInicioHora: [''],
    horaCierreFecha: [null as Date | null],
    horaCierreHora: [''],
  });

  evidenciaForm = this.fb.group({
    usuarioId: [3, Validators.required], // por ahora fijo (tecnico)
    comentario: [''],
    file: [null as File | null]
  });

  bitacoraColumns: string[] = ['nro', 'codigo', 'estado', 'fechaCreacion', 'fechaInicio', 'fechaCierre'];
  me$!: Observable<UserResp | null>;
  isDialog = false;
  isTecnico = false;
  currentUserId: number | null = null;
  assignedToMe = false;
  hoy = new Date();
  
  // Date filter function for date picker (todas las fechas habilitadas)
  dateFilter = (d: Date | null): boolean => true;
  
  // Date class function for date picker
  dateClass = (d: Date): string => {
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'special-date';
    }
    return '';
  };

  // Evidencias en memoria (pendientes de subir al guardar)
  pendingEvidencias: Array<{ file: File; comentario?: string }> = [];

  private extractDate(detalle: string | null | undefined, type: string): string {
    if (!detalle) return '-';
    const regex = new RegExp(`${type}[:\s]+([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})`, 'i');
    const match = detalle.match(regex);
    return match ? match[1] : '-';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatDateTimeIso(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    const HH = String(d.getHours()).padStart(2, '0');
    const MM = String(d.getMinutes()).padStart(2, '0');
    const SS = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${HH}:${MM}:${SS}`;
  }

  private extractEstadoFromEntry(entry: BitacoraEntry): string {
    // Extraer estado de la acción o detalle de la bitácora
    if (entry.accion) {
      // Mapear acciones a estados
      switch (entry.accion.toUpperCase()) {
        case 'CREAR':
          return 'ABIERTO';
        case 'ASIGNAR':
          return 'EN_PROGRESO';
        case 'RESOLVER':
          return 'RESUELTO';
        case 'REABRIR':
          return 'EN_PROGRESO';
        case 'CERRAR':
          return 'CERRADO';
        default:
          // Intentar extraer del detalle si existe
          if (entry.detalle) {
            const estadoMatch = entry.detalle.match(/estado[:\s]+(\w+)/i);
            if (estadoMatch) {
              return estadoMatch[1].toUpperCase();
            }
          }
          return entry.accion;
      }
    }
    return '-';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private incSvc: IncidenciasService,
    private evSvc: EvidenciasService,
    private bitSvc: BitacoraService,
    private usuariosSvc: UsuariosService,
    private catalogosService: CatalogosService,
    private userStore: UserStoreService,
    private snack: MatSnackBar,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { id: number } | null,
    @Optional() private dialogRef?: MatDialogRef<IncidenciaDetalleComponent>,
  ) {
    // Configure date picker for Spanish locale
    const locale = 'es-PE';
    
    // This will be handled by the MAT_DATE_FORMATS provider
    // The actual date formatting will be handled by the DatePipe with the 'es-PE' locale
  }

  ngOnInit(): void {
    this.id = this.data?.id ?? Number(this.route.snapshot.paramMap.get('id'));
    this.isDialog = !!this.data;
    
    // Primero obtener información del usuario, luego cargar todo
    this.usuariosSvc.me().subscribe({
      next: (me: UserResp) => {
        this.estadoForm.patchValue({ actorId: me.id });
        this.evidenciaForm.patchValue({ usuarioId: me.id });
        this.isTecnico = me?.rol === 'TECNICO';
        this.currentUserId = me?.id ?? null;
        
        // Si es jefe, autocompletar jefeId para la asignación
        if (me?.rol === 'JEFE' && me?.id) {
          this.asignarForm.patchValue({ jefeId: me.id });
        }
        
        // Ahora cargar todo con el rol ya definido
        this.cargarTodo();
        this.updateAssignedFlag();
      },
      error: (err) => {
        console.error('Error obteniendo usuario:', err);
        this.error = 'Error al obtener información del usuario';
      }
    });
    this.userStore.loadMe();
    this.me$ = this.userStore.me$;

    // Validaciones condicionales: si marca resuelto, exigir fecha y hora en inicio y cierre
    this.estadoForm.get('resolved')?.valueChanges.subscribe((val) => {
      const hif = this.estadoForm.get('horaInicioFecha');
      const hit = this.estadoForm.get('horaInicioHora');
      const hcf = this.estadoForm.get('horaCierreFecha');
      const hct = this.estadoForm.get('horaCierreHora');
      if (val) {
        hif?.setValidators([Validators.required]);
        hit?.setValidators([Validators.required]);
        hcf?.setValidators([Validators.required]);
        hct?.setValidators([Validators.required]);
      } else {
        hif?.clearValidators();
        hit?.clearValidators();
        hcf?.clearValidators();
        hct?.clearValidators();
      }
      hif?.updateValueAndValidity({ emitEvent: false });
      hit?.updateValueAndValidity({ emitEvent: false });
      hcf?.updateValueAndValidity({ emitEvent: false });
      hct?.updateValueAndValidity({ emitEvent: false });

      // Si se marca como resuelto, autocompletar fecha de hoy si está vacío
      if (val) {
        const today = new Date();
        if (!hif?.value) hif?.setValue(today);
        if (!hcf?.value) hcf?.setValue(today);
      }
    });
  }

  private updateAssignedFlag() {
    const inc = this.incidencia as any;
    if (!inc || !this.currentUserId) { this.assignedToMe = false; return; }
    const assignedId = inc?.tecnicoAsignadoId ?? inc?.tecnicoAsignado?.id ?? null;
    this.assignedToMe = assignedId != null && assignedId === this.currentUserId;
  }

  cargarTodo() {
    this.loading = true;
    this.error = null;
    
    // Cargar incidencia
    this.incSvc.getById(this.id).pipe(take(1)).subscribe({
      next: (inc) => { 
        this.incidencia = inc; 
        this.loading = false; 
        this.updateAssignedFlag(); 
      },
      error: (err) => { 
        this.error = 'No se pudo cargar la incidencia'; 
        this.loading = false; 
        console.error(err); 
      }
    });
    
    // Cargar evidencias
    this.evSvc.listar(this.id).pipe(take(1)).subscribe({ 
      next: (res) => this.evidencias = res,
      error: (err) => console.error('Error cargando evidencias:', err)
    });
    
    // Cargar bitácora
    this.cargarBitacora();

    // Cargar catálogos solo si es JEFE
    if (!this.isTecnico) {
      this.catalogosService.listarTecnicos().pipe(take(1)).subscribe({ 
        next: (tecnicos: UserResp[]) => this.tecnicos = tecnicos,
        error: (err) => console.error('Error cargando técnicos:', err)
      });
    }
  }

  cargarBitacora() {
    this.bitSvc.porIncidencia(this.id).pipe(take(1)).subscribe({
      next: (data: BitacoraEntry[]) => {
        this.bitacora = data;
        this.sortedBitacora = data
          .map((entry, index) => ({
            ...entry,
            nro: index + 1,
            codigo: this.incidencia?.codigo || '',
            estado: this.extractEstadoFromEntry(entry),
            fechaCreacion: this.formatDateTimeIso(entry.fecha),
            fechaInicio: this.formatDateTimeIso(this.incidencia?.horaInicio || null),
            fechaCierre: this.formatDateTimeIso(this.incidencia?.horaCierre || null)
          }))
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      },
      error: (err: any) => {
        console.error('Error cargando bitácora', err);
        this.snack.open('Error al cargar la bitácora', 'Cerrar', { duration: 3000 });
      }
    });
  }

  asignar() {
    if (this.asignarForm.invalid) return;
    
    const formValue = this.asignarForm.value as { jefeId?: number | null; tecnicoId: number };
    // Evitar reasignar al mismo técnico
    const currentTechId = (this.incidencia as any)?.tecnicoAsignadoId ?? (this.incidencia as any)?.tecnicoAsignado?.id ?? null;
    if (currentTechId && currentTechId === formValue.tecnicoId) {
      this.snack.open('La incidencia ya está asignada a ese técnico', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Crear payload con formato esperado por el backend
    const payload = { tecnico_id: formValue.tecnicoId };
    this.incSvc.asignar(this.id, payload).subscribe({
      next: (inc) => {
        this.incidencia = inc;
        this.snack.open('Asignación realizada', 'OK', { duration: 2000 });
        // Si es diálogo, cerrar para que la lista se refresque via afterClosed
        if (this.isDialog) {
          this.dialogRef?.close(true);
        } else {
          this.cargarTodo();
        }
      },
      error: (err) => { this.error = err?.error?.message || 'No se pudo asignar'; console.error(err); this.snack.open(this.error ?? 'Error', 'Cerrar', { duration: 3500 }); }
    });
  }

  private buildIsoLocal(dateVal?: Date | string | null, timeStr?: string): string | undefined {
    if (!dateVal || !timeStr) return undefined;
    
    let date: Date;
    
    if (dateVal instanceof Date) {
      date = new Date(dateVal);
    } else if (typeof dateVal === 'string') {
      if (dateVal.includes('/')) {
        // Handle dd/mm/yyyy format
        const [day, month, year] = dateVal.split('/').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        // Assume yyyy-mm-dd format
        date = new Date(dateVal);
      }
    } else {
      return undefined;
    }
    
    // Format as yyyy-mm-dd
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    // Combine with time and return ISO string
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes || '0', 10), 0);
    
    // Adjust for timezone offset and return ISO string
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString();
  }

  cambiarEstado() {
    if (this.estadoForm.invalid) return;
    const { actorId, horaInicioFecha, horaInicioHora, horaCierreFecha, horaCierreHora } = this.estadoForm.value as any;
    const horaInicio = this.buildIsoLocal(horaInicioFecha, horaInicioHora);
    const horaCierre = this.buildIsoLocal(horaCierreFecha, horaCierreHora);
    const payload: any = { nuevoEstado: 'RESUELTO' };
    if (horaInicio) payload.horaInicio = horaInicio;
    if (horaCierre) payload.horaCierre = horaCierre;
    this.incSvc.cambiarEstado(this.id, actorId, payload).subscribe({
      next: (inc) => { this.incidencia = inc; this.cargarTodo(); this.snack.open('Estado actualizado', 'OK', { duration: 2500 }); },
      error: (err) => { this.error = err?.error?.message || 'No se pudo cambiar el estado'; console.error(err); this.snack.open(this.error ?? 'Error', 'Cerrar', { duration: 3500 }); }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      this.evidenciaForm.patchValue({ file: null });
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (!allowed.includes(file.type)) {
      this.error = 'Formato no permitido. Solo JPG, PNG o PDF.';
      this.snack.open(this.error, 'Cerrar', { duration: 3500 });
      (event.target as HTMLInputElement).value = '';
      this.evidenciaForm.patchValue({ file: null });
      return;
    }
    if (file.size > maxBytes) {
      this.error = 'El archivo excede 10 MB.';
      this.snack.open(this.error, 'Cerrar', { duration: 3500 });
      (event.target as HTMLInputElement).value = '';
      this.evidenciaForm.patchValue({ file: null });
      return;
    }
    // Agregar de inmediato a la lista pendiente con el comentario actual
    const comentario = this.evidenciaForm.get('comentario')?.value || '';
    this.pendingEvidencias.push({ file, comentario });
    // Resetear input file y comentario
    (event.target as HTMLInputElement).value = '';
    this.evidenciaForm.patchValue({ file: null, comentario: '' });
  }

  removePendingEvidencia(idx: number) {
    this.pendingEvidencias.splice(idx, 1);
  }

  guardarTodo() {
    // Ejecutar cambio de estado (si corresponde) y subir evidencias pendientes
    const ops: Array<Observable<any>> = [] as any;

    if (this.isTecnico && this.assignedToMe && this.incidencia?.estado === 'EN_PROGRESO') {
      if (this.estadoForm.invalid) {
        this.snack.open('Completa las fechas y horas para marcar como resuelto', 'Cerrar', { duration: 3500 });
        return;
      }
      const { actorId, horaInicioFecha, horaInicioHora, horaCierreFecha, horaCierreHora, resolved } = this.estadoForm.value as any;
      if (resolved) {
        const horaInicio = this.buildIsoLocal(horaInicioFecha, horaInicioHora);
        const horaCierre = this.buildIsoLocal(horaCierreFecha, horaCierreHora);
        const payload: any = { nuevoEstado: 'RESUELTO' };
        if (horaInicio) payload.horaInicio = horaInicio;
        if (horaCierre) payload.horaCierre = horaCierre;
        ops.push(this.incSvc.cambiarEstado(this.id, actorId, payload));
      }
    }

    let usuarioId = this.evidenciaForm.get('usuarioId')?.value as number | null | undefined;
    if (!usuarioId && this.currentUserId) {
      usuarioId = this.currentUserId;
      this.evidenciaForm.patchValue({ usuarioId });
    }
    if (this.pendingEvidencias.length && !usuarioId) {
      this.snack.open('No se puede subir evidencias sin un usuario válido', 'Cerrar', { duration: 3500 });
      return;
    }
    if (usuarioId) {
      for (const p of this.pendingEvidencias) {
        ops.push(this.evSvc.subir(this.id, usuarioId, p.file, p.comentario));
      }
    }

    if (ops.length === 0) {
      this.snack.open('No hay cambios para guardar', 'Cerrar', { duration: 2500 });
      return;
    }

    // Ejecutar en paralelo y refrescar
    import('rxjs').then(({ forkJoin }) => {
      forkJoin(ops).subscribe({
        next: (results) => {
          // Actualizar evidencia si se subió algo
          const nuevos = results.filter((r: any) => r && r.urlArchivo);
          if (nuevos.length) {
            this.evidencias = [...nuevos, ...this.evidencias];
          }
          this.pendingEvidencias = [];
          this.cargarTodo();
          this.snack.open('Cambios guardados', 'OK', { duration: 2500 });
          
          // Si es modal, cerrar para refrescar la lista automáticamente
          if (this.isDialog) {
            this.dialogRef?.close(true);
          }
        },
        error: (err) => {
          console.error(err);
          this.snack.open('Error al guardar cambios', 'Cerrar', { duration: 3500 });
        }
      });
    });
  }

  // Estados permitidos segun estado actual
  puedeTransicionar(target: 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO'): boolean {
    const estado = this.incidencia?.estado;
    if (!estado) return false;
    if (estado === 'ABIERTO') return target === 'EN_PROGRESO';
    if (estado === 'EN_PROGRESO') return target === 'RESUELTO';
    if (estado === 'RESUELTO') return target === 'CERRADO';
    return false; // CERRADO no transiciona
  }

  close() {
    if (this.isDialog) {
      this.dialogRef?.close();
    }
  }
}
