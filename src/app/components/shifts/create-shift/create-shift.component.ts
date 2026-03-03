import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { DatePicker } from 'primeng/datepicker';
import { ClientResponse } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import { Select } from 'primeng/select';
import { MessageService, PrimeTemplate } from 'primeng/api';
import { CreationShiftRequest } from '../../../models/shift.model';
import { ShiftService } from '../../../services/shift.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-shift',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePicker,
    Select,
    PrimeTemplate,
    RouterLink
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
  minTime: Date | null = null;

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

    this.formShift.get('date')!.valueChanges.subscribe((selectedDate: Date | null) => {
      this.updateMinTimeAndFixTime(selectedDate);
    });

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
      clientId: clientId
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

  private roundUpToNextHalfHour(d: Date): Date {
    const x = new Date(d);
    x.setSeconds(0, 0);
    const m = x.getMinutes();
    const add = m === 0 || m === 30 ? 0 : (m < 30 ? (30 - m) : (60 - m));
    x.setMinutes(m + add);
    return x;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private updateMinTimeAndFixTime(selectedDate: Date | null) {
    const now = new Date();

    if (!selectedDate) {
      this.minTime = null;
      return;
    }

    if (this.isSameDay(selectedDate, now)) {
      this.minTime = this.roundUpToNextHalfHour(now);

      const selectedTime: Date | null = this.formShift.get('time')!.value;

      if (selectedTime) {
        const candidate = new Date(selectedDate);
        candidate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

        if (candidate.getTime() < this.minTime.getTime()) {
          //this.formShift.get('time')!.setValue(null);

          this.formShift.get('time')!.setValue(new Date(this.minTime));
        }
      }
    } else {
      this.minTime = null;
    }
  }
}
