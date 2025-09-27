import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../../core/services/usuarios.service';
import { UserCreateReq, UserUpdateReq, UserPasswordReq, UserResp, RolUsuario } from '../../models/admin-users.dto';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: UserResp[] = [];
  loading = false;
  error = '';
  success = '';

  // Crear usuario form
  createForm: UserCreateReq = {
    nombre: '',
    email: '',
    rol: 'TECNICO',
    activo: false,
    password: '1234'
  };
  createFormErrors: any = {};

  // Cambiar contraseña
  passwordChanges: { [userId: number]: { password: string; loading: boolean; error: string } } = {};

  roles: RolUsuario[] = ['ADMIN', 'JEFE', 'TECNICO'];

  constructor(private usuariosService: UsuariosService) {}

  onActivoChange(): void {
    // Limpiar errores previos
    delete this.createFormErrors.password;
    
    if (!this.createForm.activo) {
      // Si se marca como inactivo, forzar password a "1234"
      this.createForm.password = '1234';
    } else {
      // Si se marca como activo, limpiar password para que el usuario ingrese una nueva
      this.createForm.password = '';
    }
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.usuariosService.listar().subscribe({
      next: (users) => {
        this.usuarios = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios';
        this.loading = false;
        console.error('Error loading users:', err);
      }
    });
  }

  createUser(): void {
    this.createFormErrors = {};
    this.error = '';
    this.success = '';

    // Basic validation
    if (!this.createForm.nombre.trim()) {
      this.createFormErrors.nombre = 'Nombre es requerido';
    }
    if (!this.createForm.email.trim()) {
      this.createFormErrors.email = 'Email es requerido';
    } else if (!this.isValidEmail(this.createForm.email)) {
      this.createFormErrors.email = 'Email no válido';
    }
    // Validación de password según estado activo
    if (!this.createForm.activo) {
      // Usuario inactivo: password debe ser exactamente "1234"
      if (this.createForm.password !== '1234') {
        this.createFormErrors.password = 'Para usuarios inactivos la contraseña debe ser exactamente 1234';
      }
    } else {
      // Usuario activo: password fuerte y no puede ser "1234"
      if (!this.createForm.password || this.createForm.password.length < 8) {
        this.createFormErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      } else if (this.createForm.password === '1234') {
        this.createFormErrors.password = 'No se permite 1234 como contraseña';
      }
    }

    if (Object.keys(this.createFormErrors).length > 0) {
      return;
    }

    this.loading = true;
    this.usuariosService.crear(this.createForm).subscribe({
      next: (user) => {
        this.success = 'Usuario creado exitosamente';
        this.resetCreateForm();
        this.loadUsers();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 409) {
          this.error = 'Email ya existe';
        } else if (err.status === 400 && err.error?.error) {
          const errorCode = err.error.error;
          if (errorCode === 'PASSWORD_NOT_ALLOWED') {
            this.createFormErrors.password = 'No se permite 1234 como contraseña';
          } else if (errorCode === 'DEFAULT_PASSWORD_REQUIRED') {
            this.createFormErrors.password = 'Para usuarios inactivos la contraseña debe ser exactamente 1234';
          } else if (errorCode === 'WEAK_PASSWORD') {
            this.createFormErrors.password = 'La contraseña debe tener al menos 8 caracteres';
          } else {
            this.error = 'Error de validación: ' + errorCode;
          }
        } else {
          this.error = 'Error al crear usuario';
        }
        console.error('Error creating user:', err);
      }
    });
  }

  initPasswordChange(userId: number): void {
    this.passwordChanges[userId] = {
      password: '',
      loading: false,
      error: ''
    };
  }

  changePassword(userId: number): void {
    const change = this.passwordChanges[userId];
    if (!change || !change.password || change.password.length < 8) {
      change.error = 'Contraseña debe tener al menos 8 caracteres';
      return;
    }

    change.loading = true;
    change.error = '';

    const req: UserPasswordReq = { password: change.password };
    this.usuariosService.cambiarPassword(userId, req).subscribe({
      next: () => {
        this.success = 'Contraseña cambiada exitosamente';
        delete this.passwordChanges[userId];
      },
      error: (err) => {
        change.loading = false;
        if (err.status === 400 && err.error?.includes('PASSWORD_NOT_ALLOWED')) {
          change.error = 'Contraseña no permitida';
        } else {
          change.error = 'Error al cambiar contraseña';
        }
        console.error('Error changing password:', err);
      }
    });
  }

  cancelPasswordChange(userId: number): void {
    delete this.passwordChanges[userId];
  }

  private resetCreateForm(): void {
    this.createForm = {
      nombre: '',
      email: '',
      rol: 'TECNICO',
      activo: false,
      password: '1234'
    };
    this.createFormErrors = {};
    this.loading = false;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  clearMessages(): void {
    this.error = '';
    this.success = '';
  }
}
