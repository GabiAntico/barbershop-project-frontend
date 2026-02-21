import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { DatePicker } from 'primeng/datepicker';
import { ClientResponse } from '../../models/client.model';
import { ClientService } from '../../services/client.service';
import { Select } from 'primeng/select';
import { MessageService, PrimeTemplate } from 'primeng/api';
import { CreationShiftRequest } from '../../models/shift.model';
import { ShiftService } from '../../services/shift.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-shift',
  imports: [
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

  constructor(private fb: FormBuilder, private shiftService: ShiftService, private clientService: ClientService, private messageService: MessageService, private router: Router) { }

  formShift!: FormGroup;
  clients: ClientResponse[] = [];

  minDate = new Date();

  ngOnInit() {
    this.formShift = this.fb.group({
      date: [null, Validators.required],
      time: [null, Validators.required],
      client: [null, Validators.required]
    })

    this.clientService.getAllClients().subscribe({
      next: data => {
        this.clients = data
      }
    })
  }


  postShift(form: FormGroup) {
    if (form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: "El formulario no es válido"
      });
      return;
    }

    const date: Date = form.get('date')!.value;
    const time: Date = form.get('time')!.value;
    const clientId: number = form.get('client')!.value;

    const dt = new Date(date);
    dt.setHours(time.getHours(), time.getMinutes(), 0, 0);

    const yyyy = dt.getFullYear();
    const MM = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const HH = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');

    const datetime = `${yyyy}-${MM}-${dd} ${HH}:${mm}`;

    const shiftRequest: CreationShiftRequest = {
      datetime: datetime,
      clientId: clientId,
    }

    this.shiftService.postShift(shiftRequest).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Turno creado correctamente'
        });
        this.router.navigate(['/shifts-view']);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: "Error al crear el turno"
        })
      }
    })
  }
}
