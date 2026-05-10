import { Component, OnInit } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreationClientRequest } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import {Router, RouterLink} from '@angular/router';
import { MessageService } from 'primeng/api';

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

  constructor(private fb: FormBuilder, private clientService: ClientService, private router: Router, private messageService: MessageService) { }

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.email]],
      phoneNumber: ['', [Validators.required]],
      firstName: [''],
      lastName: [''],
      documentNumber: ['']
    });
  }

  postClient(form: FormGroup) {

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
      firstName: this.emptyToNull(form.controls['firstName'].value),
      lastName: this.emptyToNull(form.controls['lastName'].value),
      documentNumber: this.emptyToNull(form.controls['documentNumber'].value)
    }
    this.clientService.postClient(client).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente creado correctamente'
        });
        this.router.navigate(['/clients-view']);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: "Error al crear el cliente"
        })
      }
    });
  }
  private emptyToNull(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
