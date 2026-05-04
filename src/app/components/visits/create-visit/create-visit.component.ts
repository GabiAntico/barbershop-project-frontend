import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import {ShiftService} from '../../../services/shift.service';
import {map, switchMap, take} from 'rxjs';
import {ClientService} from '../../../services/client.service';
import {VisitService} from '../../../services/visit.service';

@Component({
  selector: 'app-create-visit',
  imports: [ReactiveFormsModule, RouterLink, Select, DatePicker],
  templateUrl: './create-visit.component.html',
  standalone: true,
  styleUrl: './create-visit.component.css'
})
export class CreateVisitComponent implements OnInit {
  formVisit!: FormGroup;

  shiftId!: number;
  selectedShift: any = null;

  paymentStatuses = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Pagado', value: 'PAID' },
    { label: 'Parcial', value: 'PARTIAL' },
    { label: 'Reembolsado', value: 'REFUNDED' },
    { label: 'Bonificado', value: 'BONIFIED' }
  ];

  paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Tarjeta', value: 'CARD' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private shiftService: ShiftService,
    private clientService: ClientService,
    private visitService: VisitService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const shiftIdParam = this.route.snapshot.paramMap.get('shiftId');

    if (!shiftIdParam) {
      return;
    }

    this.shiftId = Number(shiftIdParam);

    this.formVisit = this.fb.group({
      totalAmount: [null, [Validators.required, Validators.min(0)]],
      currency: [''],
      paymentStatus: [null, Validators.required],
      paidAt: [null],
      paymentMethod: [null]
    });

    this.formVisit.get('paymentStatus')?.valueChanges.subscribe(status => {
      const paidAtControl = this.formVisit.get('paidAt');
      const paymentMethodControl = this.formVisit.get('paymentMethod');

      if (status === 'PAID') {
        paidAtControl?.setValidators([Validators.required]);
        paymentMethodControl?.setValidators([Validators.required]);
      } else {
        paidAtControl?.setValue(null);
        paymentMethodControl?.setValue(null);
        paidAtControl?.clearValidators();
        paymentMethodControl?.clearValidators();
      }

      paidAtControl?.updateValueAndValidity();
      paymentMethodControl?.updateValueAndValidity();
    });

    // acá después cargás el turno por id y lo guardás en selectedShift
    this.shiftService.getShiftById(this.shiftId).pipe(
      switchMap(shift => {
        this.selectedShift = shift;

        return this.clientService.getClientById(shift.clientId).pipe(
          map(client => ({ shift, client }))
        );
      })
    ).subscribe({
      next: ({ shift, client }) => {
        this.selectedShift = {
          ...shift,
          client
        };
      },
      error: (err) => {
        console.error(err);
        // opcional: redirigir si falla
      }
    });

    // this.shiftService.getShiftById(this.shiftId).subscribe(...)
  }

  postVisit(): void {
    if (this.formVisit.invalid) {
      this.formVisit.markAllAsTouched();
      return;
    }

    const formValue = this.formVisit.value;

    const payload = {
      shiftId: this.shiftId,
      ...this.formVisit.value,
      paidAt: this.formatLocalDateTime(formValue.paidAt)
    };

    this.visitService.postVisit(payload).subscribe({
      next: (response) => {
        this.router.navigate(['/shifts-view']);
      },
      error: (err) => {
        console.log("ERROR: ", err);
      }
    })
  }

  formatLocalDateTime(date: Date): string | null {
    if (!date) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
