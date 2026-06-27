import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { DatePicker } from 'primeng/datepicker';
import { ClientResponse } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import { Select } from 'primeng/select';
import { MessageService, PrimeTemplate } from 'primeng/api';
import { CreationShiftRequest, TimeSlotAvailabilityResponse } from '../../../models/shift.model';
import { ShiftService } from '../../../services/shift.service';
import { ActivatedRoute, Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { SettingsService } from '../../../services/settings.service';
import { finalize } from 'rxjs';
import { WorkContextService } from '../../../services/work-context.service';
import { Employee } from '../../../models/work-context.model';

type BarberOption = {
  id: number | null;
  label: string;
};

@Component({
  selector: 'app-create-shift',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePicker,
    Select,
    PrimeTemplate,
    InputText
  ],
  templateUrl: './create-shift.component.html',
  styleUrl: './create-shift.component.css',
  standalone: true
})
export class CreateShiftComponent implements OnInit {

  constructor(
    private fb: FormBuilder,
    private shiftService: ShiftService,
    private clientService: ClientService,
    private settingsService: SettingsService,
    private workContextService: WorkContextService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  formShift!: FormGroup;
  clients: ClientResponse[] = [];
  timeSlots: TimeSlotAvailabilityResponse[] = [];
  loadingTimeSlots = false;
  isSaving = false;
  employees: Employee[] = [];
  barberOptions: BarberOption[] = [{ id: null, label: 'Asignar automaticamente' }];
  returnTo: 'agenda' | 'shifts' = 'shifts';
  returnDate: string | null = null;

  minDate = new Date();

  ngOnInit() {
    this.formShift = this.fb.group({
      date: [null, Validators.required],
      time: [null, Validators.required],
      client: [null, Validators.required],
      assignedEmployeeId: [null],
      estimatedAmount: [0, [Validators.min(0)]]
    })

    this.clientService.getAllClients().subscribe({
      next: data => {
        this.clients = data
      }
    })

    this.workContextService.getEmployees().subscribe({
      next: employees => {
        this.employees = employees;
        this.updateBarberOptions();
      }
    });

    this.settingsService.getSettings().subscribe({
      next: settings => {
        this.formShift.patchValue({
          estimatedAmount: settings.defaultEstimatedAmount ?? 0
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el monto por defecto'
        });
      }
    })

    this.formShift.get('date')!.valueChanges.subscribe((selectedDate: Date | null) => {
      this.formShift.get('time')!.setValue(null);
      this.formShift.get('assignedEmployeeId')!.setValue(null);
      this.loadAvailability(selectedDate);
    });

    this.formShift.get('time')!.valueChanges.subscribe(() => {
      this.formShift.get('assignedEmployeeId')!.setValue(null, { emitEvent: false });
      this.updateBarberOptions();
    });

    const dateParam = this.route.snapshot.queryParamMap.get('date');
    const timeParam = this.route.snapshot.queryParamMap.get('time');
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') === 'agenda' ? 'agenda' : 'shifts';
    this.returnDate = this.route.snapshot.queryParamMap.get('returnDate') ?? dateParam;

    if (dateParam) {
      const selectedDate = this.parseDateParam(dateParam);
      this.formShift.patchValue({ date: selectedDate }, { emitEvent: false });
      this.loadAvailability(selectedDate, timeParam ?? undefined);
    }

  }


  postShift(form: FormGroup) {
    if (this.isSaving) return;

    if (form.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: "El formulario no es válido"
      });
      return;
    }

    const date: Date = form.get('date')!.value;
    const time: string = form.get('time')!.value;
    const clientId: number = form.get('client')!.value;
    const assignedEmployeeId: number | null = form.get('assignedEmployeeId')!.value;
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
      estimatedAmount: estimatedAmount === null || estimatedAmount === '' ? null : Number(estimatedAmount)
    }

    this.isSaving = true;
    this.shiftService.postShift(shiftRequest).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Turno creado correctamente'
        });
        this.navigateBack();
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

  cancel(): void {
    this.navigateBack();
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
    this.shiftService.getAvailabilityByDate(this.formatDate(selectedDate)).subscribe({
      next: timeSlots => {
        this.timeSlots = timeSlots;
        this.loadingTimeSlots = false;

        if (selectedTime) {
          this.formShift.get('time')!.setValue(selectedTime);
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

  private parseDateParam(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  private navigateBack(): void {
    if (this.returnTo === 'agenda') {
      this.router.navigate(['/agenda'], {
        queryParams: this.returnDate ? { date: this.returnDate } : undefined
      });
      return;
    }

    this.router.navigate(['/shifts-view']);
  }

  private updateBarberOptions(): void {
    const selectedTime = this.formShift?.get('time')?.value;
    const selectedSlot = this.timeSlots.find(slot => slot.time === selectedTime);
    const availableIds = selectedSlot?.availableEmployeeIds ?? [];
    const activeBranchId = this.workContextService.getActiveBranchId();

    const availableEmployees = this.employees.filter(employee => {
      const belongsToBranch = !activeBranchId || employee.branches.some(branch => branch.id === activeBranchId);
      const availableForSlot = !selectedSlot || availableIds.includes(employee.id);

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
