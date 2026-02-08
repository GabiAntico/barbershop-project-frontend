import {Component, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {DatePicker} from 'primeng/datepicker';
import {ClientResponse} from '../../models/client.model';
import {ClientService} from '../../services/client.service';
import {Select} from 'primeng/select';
import {PrimeTemplate} from 'primeng/api';

@Component({
  selector: 'app-create-shift',
  imports: [
    Button,
    FormsModule,
    ReactiveFormsModule,
    DatePicker,
    Select,
    PrimeTemplate
  ],
  templateUrl: './create-shift.component.html',
  styleUrl: './create-shift.component.css',
  standalone: true
})
export class CreateShiftComponent implements OnInit {

  constructor(private fb: FormBuilder, private clientService: ClientService) {}

  formShift!: FormGroup;
  clients: ClientResponse[] = [];

  ngOnInit() {
    this.formShift = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      client: ['', Validators.required]
    })

    this.clientService.getAllClients().subscribe({
      next: data => {
        this.clients = data
      }
    })
  }


  postShift() {

  }
}
