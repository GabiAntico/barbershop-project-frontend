import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ClientResponse} from '../../../models/client.model';
import {ShiftService} from '../../../services/shift.service';
import {ClientService} from '../../../services/client.service';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {DatePicker} from 'primeng/datepicker';
import {Select} from 'primeng/select';
import {CreationShiftRequest, ShiftResponse, ShiftStatus} from '../../../models/shift.model';

@Component({
  selector: 'app-edit-shift',
  imports: [
    ReactiveFormsModule,
    DatePicker,
    Select,
    RouterLink,
    PrimeTemplate
  ],
  templateUrl: './edit-shift.component.html',
  standalone: true,
  styleUrl: './edit-shift.component.css'
})
export class EditShiftComponent implements OnInit {

  constructor(private fb: FormBuilder,
              private shiftService: ShiftService,
              private clientService: ClientService,
              private messageService: MessageService,
              private router: Router,
              private route: ActivatedRoute) { }

  formShift!: FormGroup;
  clients: ClientResponse[] = [];

  statusOptions = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Cancelado', value: 'CANCELLED' },
    { label: 'Completado', value: 'COMPLETED' }
  ];

  minDate: null | Date = new Date();

  ngOnInit() {
    this.formShift = this.fb.group({
      date: [null, Validators.required],
      time: [null, Validators.required],
      client: [null, Validators.required],
      status: [null, Validators.required]
    })

    this.clientService.getAllClients().subscribe({
      next: data => {
        this.clients = data
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    this.shiftService.getShiftById(Number(id)).subscribe({
      next: (data: ShiftResponse) => {

        if (!data.datetime) return;

        const fullDate = new Date(data.datetime); // o data.datetime
        const now = new Date();

        this.minDate = fullDate < now ? new Date(2000, 0, 1) : now;

        setTimeout(() => {
          this.formShift.patchValue({
            date: fullDate,
            time: fullDate,
            client: data.clientId,
            status: data.status,
          });
        });
      }
    })
  }


  putShift(form: FormGroup) {
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

    const date: Date = form.get('date')!.value;
    const time: Date = form.get('time')!.value;
    const clientId: number = form.get('client')!.value;
    const status: ShiftStatus  = form.get('status')!.value;

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
      status: status
    }

    this.shiftService.putShift(id, shiftRequest).subscribe({
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
    });
  }
}
