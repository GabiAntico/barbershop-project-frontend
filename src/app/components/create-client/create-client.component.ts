import {Component, OnInit} from '@angular/core';
import {InputGroup} from 'primeng/inputgroup';
import {InputText} from 'primeng/inputtext';
import {Button} from 'primeng/button';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CreationClientRequest} from '../../models/client.model';
import {ClientService} from '../../services/client.service';
import {Router} from 'express';

@Component({
  selector: 'app-create-client',
  imports: [
    InputText,
    Button,
    ReactiveFormsModule
  ],
  templateUrl: './create-client.component.html',
  styleUrl: './create-client.component.css'
})
export class CreateClientComponent implements OnInit {

  form!: FormGroup;

  constructor(private fb: FormBuilder, private clientService: ClientService) { }

  ngOnInit() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      documentNumber: ['', Validators.required]
    });
  }

  postClient(){
    const client: CreationClientRequest = {
      firstName: this.form.controls['firstName'].value,
      lastName: this.form.controls['lastName'].value,
      documentNumber: this.form.controls['documentNumber'].value
    }
    this.clientService.postClient(client).subscribe({
      next: (client: CreationClientRequest) => {
        alert("Cliente guardado correctamente: \n" + client);
      }
    })
  }
}
