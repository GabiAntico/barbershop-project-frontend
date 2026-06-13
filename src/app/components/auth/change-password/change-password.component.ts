import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../../services/auth.service';
import { WorkContextService } from '../../../services/work-context.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, InputText],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {

  form!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private workContextService: WorkContextService,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  save(): void {
    if (this.isSubmitting) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Completa los datos obligatorios');
      return;
    }

    if (this.form.value.newPassword !== this.form.value.confirmPassword) {
      this.showError('Las contraseñas no coinciden');
      return;
    }

    this.isSubmitting = true;
    this.authService.changePassword({
      currentPassword: this.form.value.currentPassword,
      newPassword: this.form.value.newPassword
    }).subscribe({
      next: () => {
        this.workContextService.loadContext().subscribe();
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Contraseña actualizada correctamente'
        });
        this.router.navigate(['/shifts-view']);
      },
      error: error => {
        this.isSubmitting = false;
        this.showError(error?.error?.message ?? 'No se pudo cambiar la contraseña');
      }
    });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
