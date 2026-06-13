import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { VisitService } from '../../../services/visit.service';
import { UpdateVisitRequest, VisitResponse } from '../../../models/visit.model';
import { ShiftService } from '../../../services/shift.service';
import { ClientService } from '../../../services/client.service';
import { ShiftResponse } from '../../../models/shift.model';
import { ClientResponse } from '../../../models/client.model';
import { finalize, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-edit-visit',
  imports: [ReactiveFormsModule, RouterLink, Select, DatePicker],
  templateUrl: './edit-visit.component.html',
  standalone: true,
  styleUrl: './edit-visit.component.css'
})
export class EditVisitComponent implements OnInit {

  formVisit!: FormGroup;
  visitId!: number;
  visit: VisitResponse | null = null;
  selectedShift: (ShiftResponse & { client?: ClientResponse }) | null = null;
  errorMessage: string | null = null;
  isSaving = false;

  paymentStatuses = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Pagado', value: 'PAID' },
    { label: 'Parcial', value: 'PARTIAL' },
    { label: 'Reembolsado', value: 'REFUNDED' }
  ];

  paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Tarjeta', value: 'CARD' }
  ];

  readonly shiftStatusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado'
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private visitService: VisitService,
    private shiftService: ShiftService,
    private clientService: ClientService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.visitId = Number(this.route.snapshot.paramMap.get('id'));

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

    this.visitService.getVisitById(this.visitId).pipe(
      switchMap(visit => {
        this.visit = visit;
        this.formVisit.patchValue({
          totalAmount: visit.totalAmount,
          currency: visit.currency,
          paymentStatus: visit.paymentStatus,
          paidAt: visit.paidAt ? new Date(visit.paidAt) : null,
          paymentMethod: visit.paymentMethod
        });

        return this.shiftService.getShiftById(visit.shiftId).pipe(
          switchMap(shift => this.clientService.getClientById(shift.clientId).pipe(
            map(client => ({ shift, client }))
          ))
        );
      })
    ).subscribe({
      next: ({ shift, client }) => {
        this.selectedShift = {
          ...shift,
          client
        };
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'No se pudo cargar la informacion de la visita.';
      }
    });
  }

  putVisit(): void {
    if (this.isSaving) return;

    this.errorMessage = null;

    if (this.formVisit.invalid) {
      this.formVisit.markAllAsTouched();
      this.errorMessage = 'Revisa los campos obligatorios antes de guardar.';
      return;
    }

    const formValue = this.formVisit.value;

    const payload: UpdateVisitRequest = {
      totalAmount: formValue.totalAmount,
      currency: formValue.currency?.trim() || null,
      paymentStatus: formValue.paymentStatus,
      paidAt: this.formatLocalDateTime(formValue.paidAt),
      paymentMethod: formValue.paymentMethod
    };

    this.isSaving = true;
    this.visitService.putVisit(this.visitId, payload).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => this.router.navigate(['/visits-view']),
      error: err => {
        console.error(err);
        this.errorMessage = this.getSaveErrorMessage(err);
      }
    });
  }

  formatLocalDateTime(date: Date): string | null {
    if (!date) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  getShiftStatusLabel(status: string | null | undefined): string {
    if (!status) return '-';

    return this.shiftStatusLabels[status] ?? status;
  }

  getClientName(): string {
    const client = this.selectedShift?.client;
    const fullName = `${client?.firstName ?? ''} ${client?.lastName ?? ''}`.trim();

    return fullName || '-';
  }

  getClientContact(): string {
    const client = this.selectedShift?.client;

    return client?.phoneNumber || client?.email || '-';
  }

  getShiftDate(): string {
    const datetime = this.selectedShift?.datetime;
    if (!datetime) return '-';

    return datetime.includes('T')
      ? datetime.split('T')[0]
      : datetime.split(' ')[0];
  }

  getShiftTime(): string {
    const datetime = this.selectedShift?.datetime;
    if (!datetime) return '-';

    return datetime.includes('T')
      ? (datetime.split('T')[1] || '').substring(0, 5)
      : (datetime.split(' ')[1] || '-');
  }

  private getSaveErrorMessage(err: any): string {
    if (err?.status === 405) {
      return 'El backend no tiene activo todavia el endpoint para editar visitas. Reinicia el backend y vuelve a intentar.';
    }

    return err?.error?.message || err?.error?.detail || 'No se pudo guardar la visita. Intenta nuevamente.';
  }
}
