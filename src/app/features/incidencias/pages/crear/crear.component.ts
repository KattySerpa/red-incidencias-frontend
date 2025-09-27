import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { IncidenciasService } from '../../../../core/services/incidencias.service';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../../core/services/usuarios.service';
import { AntenasService } from '../../../../core/services/antenas.service';
import { Antena } from '../../../../core/models/antena.model';

@Component({
  selector: 'app-incidencia-crear',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './crear.component.html',
  styleUrls: ['./crear.component.scss']
})
export class IncidenciaCrearComponent {
  tiposFalla = [
    { value: 'CAIDA_TOTAL', label: 'Caída total' },
    { value: 'BAJA_SENAL', label: 'Baja señal' },
    { value: 'INTERMITENTE', label: 'Intermitente' }
  ];

  form = this.fb.group({
    tipoFalla: ['CAIDA_TOTAL', Validators.required],
    antenaId: [null as unknown as number, Validators.required],
    descripcion: [''],
    usuarioCreadorId: [null as unknown as number, Validators.required]
  });

  loading = false;
  error: string | null = null;

  antenas: Antena[] = [];

  constructor(
    private fb: FormBuilder,
    private svc: IncidenciasService,
    private router: Router,
    private usuariosSvc: UsuariosService,
    private antenasSvc: AntenasService,
  ) {
    this.antenasSvc.listar().subscribe({ next: (as: Antena[]) => (this.antenas = as) });
    // Autocompletar el usuario creador desde la sesión
    this.usuariosSvc.me().subscribe({
      next: (me: { id: number; nombre: string; email: string; rol: 'ADMIN' | 'JEFE' | 'TECNICO'; activo: boolean }) => {
        if (me?.id) this.form.patchValue({ usuarioCreadorId: me.id });
      }
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const payload = this.form.value as any;
    this.svc.crear(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/incidencias']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudo crear la incidencia';
        console.error(err);
      }
    });
  }

  cancelar() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/incidencias']);
    }
  }
}

