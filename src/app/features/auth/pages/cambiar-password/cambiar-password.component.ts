import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Cambiar Contraseña</mat-card-title>
          <mat-card-subtitle>Debe cambiar su contraseña temporal</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" readonly>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña Actual</mat-label>
              <input matInput formControlName="oldPassword" type="password">
              <mat-error *ngIf="form.get('oldPassword')?.hasError('required')">
                Contraseña actual es requerida
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nueva Contraseña</mat-label>
              <input matInput formControlName="newPassword" type="password">
              <mat-error *ngIf="form.get('newPassword')?.hasError('required')">
                Nueva contraseña es requerida
              </mat-error>
              <mat-error *ngIf="form.get('newPassword')?.hasError('minlength')">
                Debe tener al menos 8 caracteres
              </mat-error>
              <mat-error *ngIf="form.get('newPassword')?.hasError('invalidPassword')">
                No puede usar "1234" como contraseña
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar Nueva Contraseña</mat-label>
              <input matInput formControlName="confirmPassword" type="password">
              <mat-error *ngIf="form.get('confirmPassword')?.hasError('required')">
                Confirmación es requerida
              </mat-error>
              <mat-error *ngIf="form.hasError('passwordMismatch')">
                Las contraseñas no coinciden
              </mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="error">
              {{ error }}
            </div>

            <div class="success-message" *ngIf="success">
              {{ success }}
            </div>

            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="form.invalid || loading" class="full-width">
              {{ loading ? 'Cambiando...' : 'Cambiar Contraseña' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .error-message {
      color: #f44336;
      margin: 16px 0;
      text-align: center;
    }

    .success-message {
      color: #4caf50;
      margin: 16px 0;
      text-align: center;
    }
  `]
})
export class CambiarPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      oldPassword: ['1234', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.noDefaultPasswordValidator]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Pre-llenar email desde query params
    const email = this.route.snapshot.queryParams['email'];
    if (email) {
      this.form.patchValue({ email });
    }
  }

  noDefaultPasswordValidator(control: any) {
    if (control.value === '1234') {
      return { invalidPassword: true };
    }
    return null;
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const { email, oldPassword, newPassword } = this.form.value;

    this.authService.changePassword(email, oldPassword, newPassword).subscribe({
      next: () => {
        this.success = 'Contraseña cambiada exitosamente. Redirigiendo al login...';
        setTimeout(() => {
          this.authService.logout(); // Limpiar cualquier token residual
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.error === 'PASSWORD_NOT_ALLOWED') {
          this.error = 'No puede usar "1234" como nueva contraseña';
        } else if (err.error?.error === 'WEAK_PASSWORD') {
          this.error = 'La contraseña debe tener al menos 8 caracteres';
        } else if (err.error?.error === 'INVALID_CREDENTIALS') {
          this.error = 'Contraseña actual incorrecta';
        } else {
          this.error = 'Error al cambiar contraseña. Intente nuevamente.';
        }
      }
    });
  }
}
