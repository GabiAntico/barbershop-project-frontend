import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {ClientService} from '../../../services/client.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ClientResponse, ClientRequest} from '../../../models/client.model';
import {MessageService} from 'primeng/api';


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
      phoneNumber: ['', [Validators.required]],
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
        });
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  putClient(form: FormGroup) {

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
      phoneNumber: form.get('phoneNumber')?.value.trim()
    };

    this.clientService.putClient(clientRequest).subscribe({
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
          detail: "Error al editar el cliente"
        })
      }
    });
  }
}
