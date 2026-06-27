import { Component, OnInit } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreationClientRequest } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import {Router, RouterLink} from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-create-client',
  imports: [
    InputText,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './create-client.component.html',
  styleUrl: './create-client.component.css',
  standalone: true,
})
export class CreateClientComponent implements OnInit {

  form!: FormGroup;
  isSaving = false;

  constructor(private fb: FormBuilder, private clientService: ClientService, private router: Router, private messageService: MessageService) { }

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
      selfResponsible: [true],
      responsibleContactName: [''],
      firstName: [''],
      lastName: [''],
      documentNumber: [''],
      notes: ['']
    });
    this.configureResponsibleValidators();
    this.form.get('selfResponsible')?.valueChanges.subscribe(() => this.configureResponsibleValidators());
  }

  postClient(form: FormGroup) {
    if (this.isSaving) return;

    if (form.invalid) {
      form.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: "El formulario no es válido"
      });
      return;
    }

    const client: CreationClientRequest = {
      email: this.emptyToNull(form.controls['email'].value),
      phoneNumber: form.controls['phoneNumber'].value.trim(),
      selfResponsible: Boolean(form.controls['selfResponsible'].value),
      responsibleContactName: this.isSelfResponsible()
        ? this.buildClientFullName()
        : this.emptyToNull(form.controls['responsibleContactName'].value),
      firstName: this.emptyToNull(form.controls['firstName'].value),
      lastName: this.emptyToNull(form.controls['lastName'].value),
      documentNumber: this.emptyToNull(form.controls['documentNumber'].value),
      notes: this.emptyToNull(form.controls['notes'].value)
    }

    this.isSaving = true;
    this.clientService.postClient(client).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente creado correctamente'
        });
        this.router.navigate(['/clients-view']);
      },
      error: error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getSaveErrorMessage(error, 'Error al crear el cliente')
        })
      }
    });
  }

  private getSaveErrorMessage(error: any, fallback: string): string {
    const backendMessage = error?.error?.message || error?.error?.detail || '';
    const rawError = typeof error?.error === 'string' ? error.error : JSON.stringify(error?.error ?? {});
    const normalizedMessage = String(`${backendMessage} ${rawError} ${error?.message ?? ''}`).toLowerCase();

    if (error?.status === 409 || normalizedMessage.includes('phone number already exists') || normalizedMessage.includes('client already exists')) {
      return 'El cliente ya existe';
    }

    if (normalizedMessage.includes('invalid phone number')) {
      return 'El telefono debe tener entre 8 y 15 numeros, sin espacios ni simbolos';
    }

    return backendMessage || fallback;
  }

  isSelfResponsible(): boolean {
    return Boolean(this.form?.get('selfResponsible')?.value);
  }

  private configureResponsibleValidators(): void {
    const firstName = this.form.get('firstName');
    const responsibleContactName = this.form.get('responsibleContactName');

    if (!firstName || !responsibleContactName) return;

    if (this.isSelfResponsible()) {
      firstName.clearValidators();
      responsibleContactName.clearValidators();
      responsibleContactName.setValue(this.buildClientFullName(), { emitEvent: false });
    } else {
      firstName.setValidators([Validators.required]);
      responsibleContactName.setValidators([Validators.required]);
    }

    firstName.updateValueAndValidity({ emitEvent: false });
    responsibleContactName.updateValueAndValidity({ emitEvent: false });
  }

  private buildClientFullName(): string | null {
    const firstName = this.emptyToNull(this.form.get('firstName')?.value);
    const lastName = this.emptyToNull(this.form.get('lastName')?.value);
    const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();

    return fullName || null;
  }

  private emptyToNull(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
