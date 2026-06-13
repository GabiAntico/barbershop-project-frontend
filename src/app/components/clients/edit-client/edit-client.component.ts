import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {ClientService} from '../../../services/client.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ClientResponse, ClientRequest} from '../../../models/client.model';
import {MessageService} from 'primeng/api';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-edit-client',
  imports: [
    InputText,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './edit-client.component.html',
  standalone: true,
  styleUrl: './edit-client.component.css'
})
export class EditClientComponent implements OnInit {

  form!: FormGroup;
  isSaving = false;

  constructor(private fb: FormBuilder,
              private clientService: ClientService,
              private route: ActivatedRoute,
              private router: Router,
              private messageService: MessageService) {}

  ngOnInit() {

    this.form = this.fb.group({
      firstName: [''],
      lastName: [''],
      documentNumber: [''],
      email: ['', [Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
      notes: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    this.clientService.getClientById(Number(id)).subscribe({
      next: (client: ClientResponse) => {

        this.form.patchValue({
          firstName: client.firstName ?? '',
          lastName: client.lastName ?? '',
          documentNumber: client.documentNumber ?? '',
          email: client.email ?? '',
          phoneNumber: client.phoneNumber ?? '',
          notes: client.notes ?? ''
        });
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  putClient(form: FormGroup) {
    if (this.isSaving) return;

    if (form.invalid) {
      form.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Formulario inválido' });
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID inválido' });
      return;
    }

    const emptyToNull = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      }
      return value;
    };

    const clientRequest: ClientRequest = {
      id: Number(this.route.snapshot.paramMap.get('id')),
      firstName: emptyToNull(form.get('firstName')?.value),
      lastName: emptyToNull(form.get('lastName')?.value),
      documentNumber: emptyToNull(form.get('documentNumber')?.value),
      email: emptyToNull(form.get('email')?.value),
      phoneNumber: form.get('phoneNumber')?.value.trim(),
      notes: emptyToNull(form.get('notes')?.value)
    };

    this.isSaving = true;
    this.clientService.putClient(clientRequest).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente editado correctamente'
        });
        this.router.navigate(['/clients-view']);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.getSaveErrorMessage(err, 'Error al editar el cliente')
        })
      }
    });
  }

  private getSaveErrorMessage(error: any, fallback: string): string {
    const backendMessage = error?.error?.message || error?.error?.detail || '';
    const rawError = typeof error?.error === 'string' ? error.error : JSON.stringify(error?.error ?? {});
    const normalizedMessage = String(`${backendMessage} ${rawError} ${error?.message ?? ''}`).toLowerCase();

    if (error?.status === 409 || normalizedMessage.includes('phone number already exists')) {
      return 'El cliente ya existe';
    }

    if (normalizedMessage.includes('invalid phone number')) {
      return 'El telefono debe tener entre 8 y 15 numeros, sin espacios ni simbolos';
    }

    return backendMessage || fallback;
  }
}
