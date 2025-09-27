import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    const { username, password } = this.form.value as { username: string; password: string };
    this.loading = true;
    this.error = null;
    
    // Login con JWT
    this.auth.login(username, password).subscribe({
      next: (result) => {
        // Verificar si debe cambiar contraseña
        if (typeof result === 'object' && result.mustChangePassword) {
          this.router.navigate(['/cambiar-password'], { 
            queryParams: { email: result.email } 
          });
          this.loading = false;
          return;
        }
        
        // Redirigir según roles del usuario
        const roles = this.auth.getRoles();
        
        if (roles.includes('ROLE_ADMIN')) {
          this.router.navigate(['/admin/usuarios']);
        } else if (roles.includes('ROLE_JEFE')) {
          this.router.navigate(['/reportes']);
        } else if (roles.includes('ROLE_TECNICO')) {
          this.router.navigate(['/incidencias']);
        } else {
          // Fallback por defecto
          this.router.navigate(['/incidencias']);
        }
        
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Login error:', error);
        
        if (error.status === 401) {
          this.error = 'Credenciales inválidas. Verifique su email y contraseña.';
        } else {
          this.error = 'Error al iniciar sesión. Intente nuevamente.';
        }
        
        this.loading = false;
      }
    });
  }
}
