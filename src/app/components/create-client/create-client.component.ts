import { Component, OnInit } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreationClientRequest } from '../../models/client.model';
import { ClientService } from '../../services/client.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-create-client',
  imports: [
    InputText,
    ReactiveFormsModule
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
      email: ['', Validators.required, Validators.email],
      firstName: [''],
      lastName: [''],
      documentNumber: ['']
    });
  }

  postClient(){

    const client: CreationClientRequest = {
      email: this.form.controls['email'].value,
      firstName: this.form.controls['firstName'].value,
      lastName: this.form.controls['lastName'].value,
      documentNumber: this.form.controls['documentNumber'].value
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
}
