import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { IncidenciasService } from '../../../../core/services/incidencias.service';
import { Incidencia } from '../../../../core/models/incidencia.model';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IncidenciaDetalleComponent } from '../detalle/detalle.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UsuariosService } from '../../../../core/services/usuarios.service';

@Component({
  selector: 'app-incidencias-lista',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatSortModule
  ],
  templateUrl: './lista.component.html',
  styleUrls: ['./lista.component.scss']
})
export class IncidenciasListaComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  
  displayedColumns = ['codigo', 'tipoFalla', 'antenaNombre', 'zona', 'estado', 'creadoEn', 'acciones'];
  dataSource: Incidencia[] = [];
  filteredData: Incidencia[] = [];
  error: string | null = null;
  loading = false;
  
  // Paginación
  currentPage = 0;
  pageSize = 20;
  totalItems = 0;
  
  searchForm = new FormGroup({
    codigo: new FormControl(''),
    zonaId: new FormControl<number | null>(null),
    estado: new FormControl(''),
  });
  
  private searchTerm = '';
  me: { id: number; rol: 'ADMIN'|'JEFE_OPERACIONES'|'TECNICO'|'VISOR'; nombreCompleto?: string; username?: string; zonas?: Array<{ id: number }>; } | null = null;

  constructor(private svc: IncidenciasService, private router: Router, private dialog: MatDialog, private usuariosSvc: UsuariosService) {}

  ngOnInit(): void {
    this.usuariosSvc.me().subscribe({ next: (me: { id: number; nombre: string; email: string; rol: 'ADMIN' | 'JEFE' | 'TECNICO'; activo: boolean }) => { this.me = me as any; this.cargar(); } });
    this.searchForm.get('zonaId')?.valueChanges.pipe(debounceTime(300)).subscribe(() => this.applyFilters());
    this.searchForm.get('estado')?.valueChanges.pipe(debounceTime(300)).subscribe(() => this.applyFilters());
    // Búsqueda en vivo por código
    this.searchForm.get('codigo')?.valueChanges?.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((val) => {
      this.searchTerm = (val || '').trim().toLowerCase();
      this.applyFilters();
    });
  }

  cargar() {
    this.loading = true;
    this.error = null;
    
    const filters: any = {
      page: this.currentPage,
      size: this.pageSize
    };
    
    // Filtrar por zona del usuario si es TECNICO o JEFE
    if (this.me && (this.me.rol === 'TECNICO' || this.me.rol === 'JEFE_OPERACIONES') && this.me.zonas && this.me.zonas.length > 0) {
      filters.zonaId = this.me.zonas[0].id; // Usar primera zona por simplicidad
    }
    
    // Aplicar filtros del formulario
    const formValue = this.searchForm.value;
    if (formValue.codigo) filters.codigo = formValue.codigo;
    if (formValue.estado) filters.estado = formValue.estado;
    if (formValue.zonaId) filters.zonaId = formValue.zonaId;
    
    this.svc.listar(filters).subscribe({
      next: (data) => {
        this.dataSource = data;
        this.filteredData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar incidencias';
        this.loading = false;
      }
    });
  }

  buscar() {
    this.currentPage = 0; // Reset a primera página
    this.cargar();
  }
  
  nextPage() {
    this.currentPage++;
    this.cargar();
  }
  
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.cargar();
    }
  }

  limpiarBusqueda() {
    this.searchForm.patchValue({ codigo: '' });
    this.searchTerm = '';
    this.applyFilters();  
  }

  onSort(sort: Sort) {
    this.sortData(sort);
  }

  private sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      return;
    }

    this.filteredData = [...this.filteredData].sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'codigo':
          return this.compare(a.codigo, b.codigo, isAsc);
        case 'tipoFalla':
          return this.compare(a.tipoFalla, b.tipoFalla, isAsc);
        case 'antena':
          return this.compare(a.antenaCodigo, b.antenaCodigo, isAsc);
        case 'estado':
          return this.compare(a.estado, b.estado, isAsc);
        case 'creadoEn': {
          const dateA = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
          const dateB = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
          return this.compare(dateA, dateB, isAsc);
        }
        default:
          return 0;
      }
    });
  }

  private compare(a: any, b: any, isAsc: boolean): number {
    if (a === null || a === undefined) return isAsc ? 1 : -1;
    if (b === null || b === undefined) return isAsc ? -1 : 1;
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private applyFilters() {
    let result = [...this.dataSource];
    
    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      result = result.filter(inc => 
        (inc.codigo?.toLowerCase().includes(this.searchTerm) || '')
      );
    }
    
    // Aplicar otros filtros (zona, estado, etc.) si existen
    const { zonaId, estado } = this.searchForm.value;
    if (zonaId) {
      result = result.filter(inc => inc.antenaId === zonaId);
    }
    if (estado) {
      result = result.filter(inc => inc.estado === estado);
    }
    
    this.filteredData = result;
    // Aplicar ordenamiento actual si existe
    if (this.sort) {
      this.sortData(this.sort);
    }
  }

  nuevo() {
    this.router.navigateByUrl('/incidencias/crear');
  }

  ver(row: Incidencia) {
    const ref = this.dialog.open(IncidenciaDetalleComponent, {
      width: '100vw',
      maxWidth: '100vw',
      maxHeight: '90vh',
      data: { id: row.id }
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.cargar();
      }
    });
  }
}
