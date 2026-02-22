import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ClientResponse} from '../../../models/client.model';
import {ShiftService} from '../../../services/shift.service';
import {ClientService} from '../../../services/client.service';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {DatePicker} from 'primeng/datepicker';
import {Select} from 'primeng/select';
import {ShiftResponse} from '../../../models/shift.model';

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
    });

    const id = this.route.snapshot.paramMap.get('id');
    this.shiftService.getShiftById(Number(id)).subscribe({
      next: (data: ShiftResponse) => {
        if (!data.datetime) return;

        const fullDate = new Date(data.datetime);

        this.formShift.patchValue({
          date: fullDate,
          time: fullDate,
          client: data.clientId
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

    const emptyToNull = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      }
      return value;
    };
  }
}
