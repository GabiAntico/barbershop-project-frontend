import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { VisitService } from '../../../services/visit.service';
import { UpdateVisitRequest, VisitPaymentMovementRequest, VisitPaymentMovementType, VisitResponse } from '../../../models/visit.model';
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
  movementForm!: FormGroup;
  visitId!: number;
  visit: VisitResponse | null = null;
  selectedShift: (ShiftResponse & { client?: ClientResponse }) | null = null;
  errorMessage: string | null = null;
  isSaving = false;
  paymentMovements: VisitPaymentMovementRequest[] = [];

  readonly movementTypes = [
    { label: 'Pago', value: 'PAYMENT' },
    { label: 'Reembolso', value: 'REFUND' },
    { label: 'Bonificacion', value: 'BONIFICATION' }
  ];

  readonly paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Tarjeta', value: 'CARD' }
  ];

  readonly shiftStatusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado'
  };

  readonly paymentStatusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    PARTIAL: 'Parcial',
    REFUNDED: 'Reembolsado',
    PARTIALLY_REFUNDED: 'Reembolso parcial',
    BONIFIED: 'Bonificado',
    PAID_WITH_BONIFICATION: 'Pagado con bonificacion',
    PARTIAL_WITH_ADJUSTMENT: 'Parcial con ajuste',
    PAID_WITH_ADJUSTMENT: 'Pagado con ajuste'
  };

  readonly movementTypeLabels: Record<string, string> = {
    PAYMENT: 'Pago',
    REFUND: 'Reembolso',
    BONIFICATION: 'Bonificacion'
  };

  readonly paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
    CARD: 'Tarjeta'
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
      totalAmount: [null, [Validators.required, Validators.min(0)]]
    });

    this.movementForm = this.fb.group({
      type: ['PAYMENT', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      occurredAt: [new Date(), Validators.required],
      paymentMethod: ['CASH', Validators.required],
      notes: ['']
    });

    this.movementForm.get('type')?.valueChanges.subscribe(type => this.syncMovementValidators(type));

    this.visitService.getVisitById(this.visitId).pipe(
      switchMap(visit => {
        this.visit = visit;
        this.paymentMovements = (visit.paymentMovements ?? []).map(movement => ({
          type: movement.type,
          amount: movement.amount,
          occurredAt: movement.occurredAt,
          paymentMethod: movement.paymentMethod,
          notes: movement.notes
        }));
        this.formVisit.patchValue({
          totalAmount: visit.totalAmount
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

  addMovement(): void {
    this.errorMessage = null;

    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      this.errorMessage = 'Revisa los campos del movimiento antes de agregarlo.';
      return;
    }

    const value = this.movementForm.value;
    const type = value.type as VisitPaymentMovementType;
    const movement: VisitPaymentMovementRequest = {
      type,
      amount: Number(value.amount),
      occurredAt: this.formatLocalDateTime(value.occurredAt) ?? '',
      paymentMethod: type === 'BONIFICATION' ? null : value.paymentMethod,
      notes: value.notes?.trim() || null
    };

    const validationError = this.getMovementValidationError([...this.paymentMovements, movement]);
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.paymentMovements = [...this.paymentMovements, movement];
    this.movementForm.reset({
      type: 'PAYMENT',
      amount: null,
      occurredAt: new Date(),
      paymentMethod: 'CASH',
      notes: ''
    });
    this.syncMovementValidators('PAYMENT');
  }

  removeMovement(index: number): void {
    this.paymentMovements = this.paymentMovements.filter((_, currentIndex) => currentIndex !== index);
    this.errorMessage = null;
  }

  get financialValidationMessage(): string | null {
    if (!this.formVisit) return null;

    return this.getMovementValidationError(this.paymentMovements);
  }

  putVisit(): void {
    if (this.isSaving) return;

    this.errorMessage = null;

    if (this.formVisit.invalid) {
      this.formVisit.markAllAsTouched();
      this.errorMessage = 'Revisa el monto total antes de guardar.';
      return;
    }

    const validationError = this.financialValidationMessage;
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    const payload: UpdateVisitRequest = {
      totalAmount: Number(this.formVisit.value.totalAmount),
      paymentMovements: this.paymentMovements
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

  syncMovementValidators(type: string): void {
    const paymentMethodControl = this.movementForm.get('paymentMethod');

    if (type === 'BONIFICATION') {
      paymentMethodControl?.setValue(null);
      paymentMethodControl?.clearValidators();
    } else {
      if (!paymentMethodControl?.value) {
        paymentMethodControl?.setValue('CASH');
      }
      paymentMethodControl?.setValidators([Validators.required]);
    }

    paymentMethodControl?.updateValueAndValidity();
  }

  getFinancialSummary(movements: VisitPaymentMovementRequest[] = this.paymentMovements) {
    const total = Number(this.formVisit?.get('totalAmount')?.value ?? 0);
    const grossPaid = this.sumMovements(movements, 'PAYMENT');
    const refunded = this.sumMovements(movements, 'REFUND');
    const bonified = this.sumMovements(movements, 'BONIFICATION');
    const netPaid = Math.max(grossPaid - refunded, 0);
    const covered = netPaid + bonified;
    const pending = Math.max(total - covered, 0);

    return { total, grossPaid, refunded, bonified, netPaid, covered, pending };
  }

  getCalculatedPaymentStatus(): string {
    const summary = this.getFinancialSummary();
    const hasRefund = summary.refunded > 0;
    const hasBonus = summary.bonified > 0;

    if (summary.covered <= 0) {
      return hasRefund && summary.grossPaid > 0 ? 'REFUNDED' : 'PENDING';
    }

    if (hasRefund && hasBonus) {
      return summary.pending > 0 ? 'PARTIAL_WITH_ADJUSTMENT' : 'PAID_WITH_ADJUSTMENT';
    }

    if (summary.pending > 0) {
      return hasRefund ? 'PARTIALLY_REFUNDED' : 'PARTIAL';
    }

    if (hasRefund && summary.netPaid <= 0) {
      return 'REFUNDED';
    }

    if (hasRefund && summary.netPaid > 0) {
      return 'PARTIALLY_REFUNDED';
    }

    if (hasBonus && summary.netPaid <= 0) {
      return 'BONIFIED';
    }

    if (hasBonus) {
      return 'PAID_WITH_BONIFICATION';
    }

    return summary.total === 0 ? 'PENDING' : 'PAID';
  }

  getMovementValidationError(movements: VisitPaymentMovementRequest[]): string | null {
    const summary = this.getFinancialSummary(movements);

    if (summary.refunded > summary.grossPaid) {
      return 'Los reembolsos no pueden superar los pagos recibidos.';
    }

    if (summary.covered > summary.total) {
      return 'Los pagos y bonificaciones no pueden superar el monto total.';
    }

    return null;
  }

  formatLocalDateTime(date: Date): string | null {
    if (!date) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  formatDateTime(value: string | null): string {
    if (!value) return '\u2014';

    const [date, time = ''] = value.includes('T') ? value.split('T') : value.split(' ');
    return `${date} ${time.substring(0, 5)}`.trim();
  }

  formatMoney(value: number | null | undefined): string {
    return `${this.visit?.currency || 'ARS'} ${Number(value ?? 0).toFixed(2)}`;
  }

  getShiftStatusLabel(status: string | null | undefined): string {
    if (!status) return '\u2014';

    return this.shiftStatusLabels[status] ?? status;
  }

  getPaymentStatusLabel(status: string | null | undefined): string {
    if (!status) return '\u2014';

    return this.paymentStatusLabels[status] ?? status;
  }

  getMovementTypeLabel(type: string): string {
    return this.movementTypeLabels[type] ?? type;
  }

  getPaymentMethodLabel(method: string | null): string {
    if (!method) return '\u2014';

    return this.paymentMethodLabels[method] ?? method;
  }

  getClientName(): string {
    const client = this.selectedShift?.client;
    const fullName = `${client?.firstName ?? ''} ${client?.lastName ?? ''}`.trim();

    return fullName || '\u2014';
  }

  getClientContact(): string {
    const client = this.selectedShift?.client;

    return client?.phoneNumber || client?.email || '\u2014';
  }

  getShiftDate(): string {
    const datetime = this.selectedShift?.datetime;
    if (!datetime) return '\u2014';

    return datetime.includes('T')
      ? datetime.split('T')[0]
      : datetime.split(' ')[0];
  }

  getShiftTime(): string {
    const datetime = this.selectedShift?.datetime;
    if (!datetime) return '\u2014';

    return datetime.includes('T')
      ? (datetime.split('T')[1] || '').substring(0, 5)
      : (datetime.split(' ')[1] || '\u2014');
  }

  private getSaveErrorMessage(err: any): string {
    return err?.error?.message || err?.error?.detail || 'No se pudo guardar la visita. Intenta nuevamente.';
  }

  private sumMovements(movements: VisitPaymentMovementRequest[], type: VisitPaymentMovementType): number {
    return movements
      .filter(movement => movement.type === type)
      .reduce((total, movement) => total + Number(movement.amount ?? 0), 0);
  }
}
