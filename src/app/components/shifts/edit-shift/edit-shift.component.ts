import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ClientResponse} from '../../../models/client.model';
import {ShiftService} from '../../../services/shift.service';
import {ClientService} from '../../../services/client.service';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {DatePicker} from 'primeng/datepicker';
import {Select} from 'primeng/select';
import {CreationShiftRequest, ShiftResponse, ShiftStatus, TimeSlotAvailabilityResponse} from '../../../models/shift.model';
import {InputText} from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { WorkContextService } from '../../../services/work-context.service';
import { Employee } from '../../../models/work-context.model';

type BarberOption = {
  id: number | null;
  label: string;
};

@Component({
  selector: 'app-edit-shift',
  imports: [
    ReactiveFormsModule,
    DatePicker,
    Select,
    RouterLink,
    PrimeTemplate,
    InputText
  ],
  templateUrl: './edit-shift.component.html',
  standalone: true,
  styleUrl: './edit-shift.component.css'
})
export class EditShiftComponent implements OnInit {

  constructor(private fb: FormBuilder,
              private shiftService: ShiftService,
              private clientService: ClientService,
              private workContextService: WorkContextService,
              private messageService: MessageService,
              private router: Router,
              private route: ActivatedRoute) { }

  formShift!: FormGroup;
  clients: ClientResponse[] = [];
  timeSlots: TimeSlotAvailabilityResponse[] = [];
  loadingTimeSlots = false;
  isSaving = false;
  employees: Employee[] = [];
  barberOptions: BarberOption[] = [{ id: null, label: 'Asignar automaticamente' }];
  shiftId!: number;
  originalShiftDate: string | null = null;
  originalShiftTime: string | null = null;

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
      assignedEmployeeId: [null],
      status: [null, Validators.required],
      estimatedAmount: [0, [Validators.min(0)]]
    });

    this.clientService.getAllClients().subscribe({
      next: data => {
        this.clients = data;
      }
    });

    this.workContextService.getEmployees().subscribe({
      next: employees => {
        this.employees = employees;
        this.updateBarberOptions();
      }
    });

    this.formShift.get('date')!.valueChanges.subscribe((selectedDate: Date | null) => {
      this.formShift.get('time')!.setValue(null);
      this.formShift.get('assignedEmployeeId')!.setValue(null);
      this.loadAvailability(selectedDate);
    });

    this.formShift.get('time')!.valueChanges.subscribe(() => {
      this.formShift.get('assignedEmployeeId')!.setValue(null, { emitEvent: false });
      this.updateBarberOptions();
    });

    this.shiftId = Number(this.route.snapshot.paramMap.get('id'));
    this.shiftService.getShiftById(this.shiftId).subscribe({
      next: (data: ShiftResponse) => {
        if (!data.datetime) return;

        const fullDate = new Date(data.datetime);
        const now = new Date();

        this.minDate = fullDate < now ? new Date(2000, 0, 1) : now;

        const selectedTime = this.formatTime(fullDate);
        this.originalShiftDate = this.formatDate(fullDate);
        this.originalShiftTime = selectedTime;

        this.formShift.patchValue({
          date: fullDate,
          time: selectedTime,
          client: data.clientId,
          assignedEmployeeId: data.assignedEmployeeId ?? null,
          status: data.status,
          estimatedAmount: data.estimatedAmount ?? 0
        }, { emitEvent: false });

        this.loadAvailability(fullDate, selectedTime);
      }
    });
  }

  putShift(form: FormGroup) {
    if (this.isSaving) return;

    if (form.invalid) {
      form.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Formulario invalido' });
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID invalido' });
      return;
    }

    const date: Date = form.get('date')!.value;
    const time: string = form.get('time')!.value;
    const clientId: number = form.get('client')!.value;
    const assignedEmployeeId: number | null = form.get('assignedEmployeeId')!.value;
    const status: ShiftStatus  = form.get('status')!.value;
    const estimatedAmount = form.get('estimatedAmount')!.value;

    const dt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    dt.setHours(hours, minutes, 0, 0);

    const yyyy = dt.getFullYear();
    const MM = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const HH = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');

    const datetime = `${yyyy}-${MM}-${dd} ${HH}:${mm}`;

    const shiftRequest: CreationShiftRequest = {
      datetime: datetime,
      clientId: clientId,
      assignedEmployeeId: assignedEmployeeId,
      status: status,
      estimatedAmount: estimatedAmount === null || estimatedAmount === '' ? null : Number(estimatedAmount)
    };

    this.isSaving = true;
    this.shiftService.putShift(id, shiftRequest).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Turno editado correctamente'
        });
        this.router.navigate(['/shifts-view']);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al editar el turno'
        });
      }
    });
  }

  selectTimeSlot(slot: TimeSlotAvailabilityResponse) {
    if (this.isSaving) return;
    if (!slot.available) return;

    this.formShift.get('time')!.setValue(slot.time);
  }

  isSelectedTime(slot: TimeSlotAvailabilityResponse): boolean {
    return this.formShift.get('time')!.value === slot.time;
  }

  getAvailabilityLabel(slot: TimeSlotAvailabilityResponse): string {
    if (slot.totalCapacity <= 0) return 'Sin barberos';

    return `${slot.availableCount}/${slot.totalCapacity} libres`;
  }

  hasSelectedTime(): boolean {
    return !!this.formShift.get('time')!.value;
  }

  getBarberLabel(employee: Employee): string {
    return employee.displayName || employee.email;
  }

  getClientLabel(client: ClientResponse): string {
    const fullName = [client.firstName, client.lastName].filter(Boolean).join(' ');
    const contact = client.email ? `${client.phoneNumber} - ${client.email}` : client.phoneNumber;

    return fullName ? `${fullName} - ${client.phoneNumber}` : contact || '';
  }

  private loadAvailability(selectedDate: Date | null, selectedTime?: string) {
    if (!selectedDate) {
      this.timeSlots = [];
      return;
    }

    this.loadingTimeSlots = true;
    this.shiftService.getAvailabilityByDate(this.formatDate(selectedDate), this.shiftId).subscribe({
      next: timeSlots => {
        this.timeSlots = this.keepOriginalSlotAvailable(timeSlots, selectedDate);
        this.loadingTimeSlots = false;

        if (selectedTime) {
          this.formShift.get('time')!.setValue(selectedTime, { emitEvent: false });
        }
        this.updateBarberOptions();
      },
      error: () => {
        this.timeSlots = [];
        this.loadingTimeSlots = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los horarios disponibles'
        });
      }
    });
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${MM}-${dd}`;
  }

  private formatTime(date: Date): string {
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${HH}:${mm}`;
  }

  private keepOriginalSlotAvailable(
    timeSlots: TimeSlotAvailabilityResponse[],
    selectedDate: Date
  ): TimeSlotAvailabilityResponse[] {
    const selectedDateValue = this.formatDate(selectedDate);

    if (selectedDateValue !== this.originalShiftDate || !this.originalShiftTime) {
      return timeSlots;
    }

    return timeSlots.map(slot => {
      if (slot.time !== this.originalShiftTime) return slot;

      return {
        ...slot,
        available: true
      };
    });
  }

  private updateBarberOptions(): void {
    const selectedTime = this.formShift?.get('time')?.value;
    const selectedSlot = this.timeSlots.find(slot => slot.time === selectedTime);
    const availableIds = selectedSlot?.availableEmployeeIds ?? [];
    const currentAssignedId = this.formShift?.get('assignedEmployeeId')?.value;
    const activeBranchId = this.workContextService.getActiveBranchId();

    const availableEmployees = this.employees.filter(employee => {
      const belongsToBranch = !activeBranchId || employee.branches.some(branch => branch.id === activeBranchId);
      const availableForSlot = !selectedSlot || availableIds.includes(employee.id) || employee.id === currentAssignedId;

      return belongsToBranch && availableForSlot;
    });

    this.barberOptions = [
      { id: null, label: 'Asignar automaticamente' },
      ...availableEmployees.map(employee => ({
        id: employee.id,
        label: this.getBarberLabel(employee)
      }))
    ];
  }
}
