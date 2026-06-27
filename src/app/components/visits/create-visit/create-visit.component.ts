import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { ShiftService } from '../../../services/shift.service';
import { finalize, map, switchMap } from 'rxjs';
import { ClientService } from '../../../services/client.service';
import { VisitService } from '../../../services/visit.service';
import { SettingsService } from '../../../services/settings.service';
import { VisitPaymentMovementRequest, VisitPaymentMovementType } from '../../../models/visit.model';

@Component({
  selector: 'app-create-visit',
  imports: [ReactiveFormsModule, RouterLink, Select, DatePicker],
  templateUrl: './create-visit.component.html',
  standalone: true,
  styleUrl: './create-visit.component.css'
})
export class CreateVisitComponent implements OnInit {
  formVisit!: FormGroup;
  movementForm!: FormGroup;

  shiftId!: number;
  selectedShift: any = null;
  returnTo: 'agenda' | 'shifts' = 'shifts';
  returnDate: string | null = null;
  isSaving = false;
  defaultCurrency = 'ARS';
  errorMessage: string | null = null;
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
    private shiftService: ShiftService,
    private clientService: ClientService,
    private visitService: VisitService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const shiftIdParam = this.route.snapshot.paramMap.get('shiftId');

    if (!shiftIdParam) {
      return;
    }

    this.shiftId = Number(shiftIdParam);
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') === 'agenda' ? 'agenda' : 'shifts';
    this.returnDate = this.route.snapshot.queryParamMap.get('returnDate');

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

    this.settingsService.getSettings().subscribe({
      next: settings => this.defaultCurrency = settings.defaultCurrency ?? 'ARS'
    });

    this.shiftService.getShiftById(this.shiftId).pipe(
      switchMap(shift => {
        this.selectedShift = shift;
        this.formVisit.patchValue({
          totalAmount: shift.estimatedAmount ?? null
        });
        this.movementForm.patchValue({
          amount: shift.estimatedAmount ?? null
        });

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
      error: err => {
        console.error(err);
        this.errorMessage = 'No se pudo cargar la informacion del turno.';
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

  postVisit(): void {
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

    const payload = {
      shiftId: this.shiftId,
      totalAmount: Number(this.formVisit.value.totalAmount),
      paymentMovements: this.paymentMovements
    };

    this.isSaving = true;
    this.visitService.postVisit(payload).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        if (this.returnTo === 'agenda') {
          this.router.navigate(['/agenda'], {
            queryParams: this.returnDate ? { date: this.returnDate } : undefined
          });
          return;
        }

        this.router.navigate(['/shifts-view']);
      },
      error: err => {
        console.error(err);
        this.errorMessage = err?.error?.message || err?.error?.detail || 'No se pudo guardar la visita.';
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

  getMovementTypeLabel(type: string): string {
    return this.movementTypeLabels[type] ?? type;
  }

  getPaymentMethodLabel(method: string | null): string {
    if (!method) return '\u2014';

    return this.paymentMethodLabels[method] ?? method;
  }

  formatMoney(value: number | null | undefined): string {
    return `${this.defaultCurrency} ${Number(value ?? 0).toFixed(2)}`;
  }

  formatDateTime(value: string | null): string {
    if (!value) return '\u2014';

    const [date, time = ''] = value.includes('T') ? value.split('T') : value.split(' ');
    return `${date} ${time.substring(0, 5)}`.trim();
  }

  formatLocalDateTime(date: Date): string | null {
    if (!date) return null;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  getShiftStatusLabel(status: string | null | undefined): string {
    if (!status) return '\u2014';

    return this.shiftStatusLabels[status] ?? status;
  }

  private sumMovements(movements: VisitPaymentMovementRequest[], type: VisitPaymentMovementType): number {
    return movements
      .filter(movement => movement.type === type)
      .reduce((total, movement) => total + Number(movement.amount ?? 0), 0);
  }
}
