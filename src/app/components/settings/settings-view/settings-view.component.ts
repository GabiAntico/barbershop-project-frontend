import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { SettingsService } from '../../../services/settings.service';
import { ScheduleSlot, ScheduleSettingsRequest } from '../../../models/settings.model';
import { WorkContextService } from '../../../services/work-context.service';
import { Branch, Employee, EmployeeScheduleDay, EmployeeScheduleDayName, WorkContext } from '../../../models/work-context.model';
import { finalize } from 'rxjs';

type SettingsTab = 'amount' | 'schedule' | 'branches' | 'employees';
type ScheduleMode = 'DATE' | 'RANGE' | 'DEFAULT';
type EmployeeScheduleDayView = EmployeeScheduleDay & {
  startTimeDate: Date;
  endTimeDate: Date;
};

@Component({
  selector: 'app-settings-view',
  imports: [
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    InputText,
    Select,
    DatePicker
  ],
  templateUrl: './settings-view.component.html',
  styleUrl: './settings-view.component.css',
  standalone: true
})
export class SettingsViewComponent implements OnInit {

  amountForm!: FormGroup;
  scheduleForm!: FormGroup;
  branchForm!: FormGroup;
  employeeForm!: FormGroup;
  employeeBranchesForm!: FormGroup;
  savedDefaultEstimatedAmount: number | null = null;
  savedDefaultCurrency = 'ARS';
  readonly currencyOptions = [
    { label: 'ARS - Peso argentino', value: 'ARS' },
    { label: 'USD - Dolar estadounidense', value: 'USD' },
    { label: 'BRL - Real brasileno', value: 'BRL' },
    { label: 'UYU - Peso uruguayo', value: 'UYU' },
    { label: 'CLP - Peso chileno', value: 'CLP' }
  ];
  context: WorkContext | null = null;
  branches: Branch[] = [];
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  savedSelectedEmployeeBranchIds: number[] = [];
  selectedScheduleBranchId: number | null = null;
  employeeScheduleDays: EmployeeScheduleDayView[] = [];
  savedEmployeeScheduleSignature = '';

  activeTab: SettingsTab = 'amount';
  scheduleMode: ScheduleMode = 'DATE';
  slots: ScheduleSlot[] = [];
  savedScheduleSlots: string[] = [];
  newSlotTime: Date | null = null;
  loadingSchedule = false;
  savingSettings = false;
  savingSchedule = false;
  creatingBranch = false;
  creatingEmployee = false;
  savingEmployeeBranches = false;
  loadingEmployeeSchedule = false;
  savingEmployeeSchedule = false;
  minScheduleDate = new Date();
  readonly employeeScheduleDayOrder: EmployeeScheduleDayName[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
  ];
  readonly employeeScheduleDayLabels: Record<EmployeeScheduleDayName, string> = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miercoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sabado',
    SUNDAY: 'Domingo'
  };

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private workContextService: WorkContextService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.amountForm = this.fb.group({
      defaultEstimatedAmount: [0, [Validators.min(0)]],
      defaultCurrency: ['ARS', Validators.required]
    });
    this.branchForm = this.fb.group({
      name: ['', Validators.required],
      address: ['']
    });
    this.employeeForm = this.fb.group({
      displayName: [''],
      email: ['', [Validators.required, Validators.email]],
      temporaryPassword: ['', [Validators.required, Validators.minLength(6)]],
      branchIds: [[], Validators.required]
    });
    this.employeeBranchesForm = this.fb.group({
      branchIds: [[], Validators.required]
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.minScheduleDate.setHours(0, 0, 0, 0);

    this.scheduleForm = this.fb.group({
      date: [today],
      startDate: [today],
      endDate: [today]
    });

    this.settingsService.getSettings().subscribe({
      next: settings => {
        this.savedDefaultEstimatedAmount = settings.defaultEstimatedAmount ?? 0;
        this.savedDefaultCurrency = settings.defaultCurrency ?? 'ARS';
        this.amountForm.patchValue({
          defaultEstimatedAmount: this.savedDefaultEstimatedAmount,
          defaultCurrency: this.savedDefaultCurrency
        });
      },
      error: () => this.showError('No se pudo cargar la configuracion')
    });

    this.workContextService.loadContext().subscribe({
      next: context => {
        this.context = context;
        this.branches = context.branches;
        if (this.isAdmin()) {
          this.loadEmployees();
        }
      }
    });

    this.loadSchedule();
  }

  saveSettings(form: FormGroup) {
    if (this.savingSettings) return;

    if (form.invalid) {
      form.markAllAsTouched();
      this.showError('Formulario invalido');
      return;
    }

    const amount = form.get('defaultEstimatedAmount')!.value;
    const currency = form.get('defaultCurrency')!.value || 'ARS';

    this.savingSettings = true;
    this.settingsService.putSettings({
      defaultEstimatedAmount: amount === null || amount === '' ? 0 : Number(amount),
      defaultCurrency: currency
    }).pipe(
      finalize(() => this.savingSettings = false)
    ).subscribe({
      next: settings => {
        this.savedDefaultEstimatedAmount = settings.defaultEstimatedAmount ?? 0;
        this.savedDefaultCurrency = settings.defaultCurrency ?? 'ARS';
        this.amountForm.patchValue({
          defaultEstimatedAmount: this.savedDefaultEstimatedAmount,
          defaultCurrency: this.savedDefaultCurrency
        });
        this.showSuccess('Configuracion guardada correctamente');
      },
      error: () => this.showError('No se pudo guardar la configuracion')
    });
  }

  hasSettingsChanges(): boolean {
    return this.normalizeAmount(this.amountForm.get('defaultEstimatedAmount')?.value) !== this.normalizeAmount(this.savedDefaultEstimatedAmount)
      || (this.amountForm.get('defaultCurrency')?.value || 'ARS') !== this.savedDefaultCurrency;
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab = tab;
    if (tab === 'employees') {
      this.loadEmployees();
    }
    if (tab === 'branches') {
      this.loadBranches();
    }
  }

  isAdmin(): boolean {
    return this.context?.userRole?.toUpperCase() === 'ADMIN';
  }

  loadBranches(): void {
    if (!this.isAdmin()) return;

    this.workContextService.getBranches().subscribe({
      next: branches => this.branches = branches,
      error: () => this.showError('No se pudieron cargar las sucursales')
    });
  }

  createBranch(): void {
    if (this.creatingBranch) return;

    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      this.showError('Completa el nombre de la sucursal');
      return;
    }

    this.creatingBranch = true;
    this.workContextService.createBranch(this.branchForm.value).pipe(
      finalize(() => this.creatingBranch = false)
    ).subscribe({
      next: branch => {
        this.branches = [...this.branches, branch];
        this.branchForm.reset();
        this.workContextService.loadContext().subscribe();
        this.showSuccess('Sucursal creada correctamente');
      },
      error: () => this.showError('No se pudo crear la sucursal')
    });
  }

  loadEmployees(): void {
    if (!this.isAdmin()) return;

    this.workContextService.getEmployees().subscribe({
      next: employees => {
        this.employees = employees;
        if (this.selectedEmployee) {
          const updatedSelection = employees.find(employee => employee.id === this.selectedEmployee!.id) ?? null;
          this.selectEmployee(updatedSelection);
        }
      },
      error: () => this.showError('No se pudieron cargar los empleados')
    });
  }

  createEmployee(): void {
    if (this.creatingEmployee) return;

    if (this.employeeForm.invalid || this.employeeForm.value.branchIds.length === 0) {
      this.employeeForm.markAllAsTouched();
      this.showError('Completa email, contraseña temporal y al menos una sucursal');
      return;
    }

    this.creatingEmployee = true;
    this.workContextService.createEmployee(this.employeeForm.value).pipe(
      finalize(() => this.creatingEmployee = false)
    ).subscribe({
      next: employee => {
        this.employees = [...this.employees, employee];
        this.employeeForm.reset({ displayName: '', email: '', temporaryPassword: '', branchIds: [] });
        this.showSuccess('Empleado creado correctamente');
      },
      error: error => this.showError(error?.error?.message ?? 'No se pudo crear el empleado')
    });
  }

  getEmployeeBranches(employee: Employee): string {
    return employee.branches.map(branch => branch.name).join(', ');
  }

  selectEmployee(employee: Employee | null): void {
    this.selectedEmployee = employee;
    const branchIds = employee?.branches.map(branch => branch.id).sort((a, b) => a - b) ?? [];
    this.savedSelectedEmployeeBranchIds = [...branchIds];
    this.employeeBranchesForm.patchValue({ branchIds });
    this.employeeBranchesForm.markAsPristine();
    this.selectedScheduleBranchId = employee?.branches[0]?.id ?? null;
    this.employeeScheduleDays = this.getDefaultEmployeeScheduleDays();
    this.savedEmployeeScheduleSignature = this.getEmployeeScheduleSignature();

    if (employee && this.selectedScheduleBranchId) {
      this.loadEmployeeSchedule();
    }
  }

  saveEmployeeBranches(): void {
    if (this.savingEmployeeBranches) return;
    if (!this.selectedEmployee) return;

    const branchIds = this.employeeBranchesForm.get('branchIds')!.value ?? [];
    if (branchIds.length === 0) {
      this.showError('El empleado debe tener al menos una sucursal');
      return;
    }

    this.savingEmployeeBranches = true;
    this.workContextService.updateEmployeeBranches(this.selectedEmployee.id, { branchIds }).pipe(
      finalize(() => this.savingEmployeeBranches = false)
    ).subscribe({
      next: employee => {
        this.employees = this.employees.map(item => item.id === employee.id ? employee : item);
        this.selectEmployee(employee);
        this.showSuccess('Accesos actualizados correctamente');
      },
      error: error => this.showError(error?.error?.message ?? 'No se pudieron actualizar los accesos')
    });
  }

  hasSelectedEmployeeBranchChanges(): boolean {
    const current = this.getSelectedEmployeeBranchIds();
    return current.join('|') !== this.savedSelectedEmployeeBranchIds.join('|');
  }

  isSelectedEmployeeBranchSelected(branchId: number): boolean {
    return this.getSelectedEmployeeBranchIds().includes(branchId);
  }

  toggleSelectedEmployeeBranch(branchId: number): void {
    const control = this.employeeBranchesForm.get('branchIds')!;
    const selected = this.getSelectedEmployeeBranchIds();
    const next = selected.includes(branchId)
      ? selected.filter(id => id !== branchId)
      : [...selected, branchId].sort((a, b) => a - b);

    control.setValue(next);
    control.markAsDirty();
    control.markAsTouched();
  }

  isEmployeeBranchSelected(branchId: number): boolean {
    const selected = this.employeeForm.get('branchIds')?.value ?? [];
    return selected.includes(branchId);
  }

  toggleEmployeeBranch(branchId: number): void {
    const control = this.employeeForm.get('branchIds')!;
    const selected: number[] = control.value ?? [];
    const next = selected.includes(branchId)
      ? selected.filter(id => id !== branchId)
      : [...selected, branchId];

    control.setValue(next);
    control.markAsDirty();
    control.markAsTouched();
  }

  getSelectedEmployeeBranchIds(): number[] {
    return [...(this.employeeBranchesForm.get('branchIds')?.value ?? [])].sort((a, b) => a - b);
  }

  onEmployeeScheduleBranchChange(branchId: number | string | null): void {
    this.selectedScheduleBranchId = branchId ? Number(branchId) : null;
    this.loadEmployeeSchedule();
  }

  loadEmployeeSchedule(): void {
    if (!this.selectedEmployee || !this.selectedScheduleBranchId) {
      this.employeeScheduleDays = this.getDefaultEmployeeScheduleDays();
      this.savedEmployeeScheduleSignature = this.getEmployeeScheduleSignature();
      return;
    }

    this.loadingEmployeeSchedule = true;
    this.workContextService.getEmployeeSchedule(this.selectedEmployee.id, this.selectedScheduleBranchId).pipe(
      finalize(() => this.loadingEmployeeSchedule = false)
    ).subscribe({
      next: schedule => {
        this.employeeScheduleDays = this.normalizeEmployeeScheduleDays(schedule.days);
        this.savedEmployeeScheduleSignature = this.getEmployeeScheduleSignature();
      },
      error: () => this.showError('No se pudo cargar el horario del empleado')
    });
  }

  saveEmployeeSchedule(): void {
    if (this.savingEmployeeSchedule) return;
    if (!this.selectedEmployee || !this.selectedScheduleBranchId) return;

    if (!this.hasValidEmployeeSchedule()) {
      this.showError('Revisa los horarios: la salida debe ser posterior a la entrada');
      return;
    }

    this.savingEmployeeSchedule = true;
    this.workContextService.updateEmployeeSchedule(this.selectedEmployee.id, {
      branchId: this.selectedScheduleBranchId,
      days: this.getEmployeeSchedulePayload()
    }).pipe(
      finalize(() => this.savingEmployeeSchedule = false)
    ).subscribe({
      next: schedule => {
        this.employeeScheduleDays = this.normalizeEmployeeScheduleDays(schedule.days);
        this.savedEmployeeScheduleSignature = this.getEmployeeScheduleSignature();
        this.showSuccess('Horario del empleado guardado correctamente');
      },
      error: error => this.showError(error?.error?.message ?? 'No se pudo guardar el horario del empleado')
    });
  }

  toggleEmployeeScheduleDay(day: EmployeeScheduleDayView): void {
    day.enabled = !day.enabled;
  }

  hasEmployeeScheduleChanges(): boolean {
    return this.getEmployeeScheduleSignature() !== this.savedEmployeeScheduleSignature;
  }

  hasValidEmployeeSchedule(): boolean {
    return this.employeeScheduleDays.every(day => {
      if (!day.enabled) return true;
      return this.minutesBetween(day.startTime, day.endTime) > 0;
    });
  }

  getEmployeeScheduleDayLabel(day: EmployeeScheduleDayName): string {
    return this.employeeScheduleDayLabels[day];
  }

  onEmployeeScheduleTimeChange(day: EmployeeScheduleDayView, field: 'startTime' | 'endTime', value: Date | null): void {
    if (!value) return;

    day[field] = this.formatTime(value);
  }

  onScheduleModeChange(mode: ScheduleMode) {
    this.scheduleMode = mode;
    this.loadSchedule();
  }

  loadSchedule() {
    if (this.scheduleMode === 'RANGE' && !this.hasCompleteRange()) {
      this.slots = [];
      this.loadingSchedule = false;
      return;
    }

    this.loadingSchedule = true;
    const scheduleRequest = this.getScheduleRequest();

    scheduleRequest.subscribe({
      next: schedule => {
        this.slots = schedule.slots;
        this.savedScheduleSlots = this.getSlotTimes(this.slots);
        this.loadingSchedule = false;
      },
      error: () => {
        this.slots = [];
        this.loadingSchedule = false;
        this.showError('No se pudieron cargar los horarios');
      }
    });
  }

  addSlot() {
    if (!this.newSlotTime) return;

    const newSlot = this.formatTime(this.newSlotTime);

    if (this.slots.some(slot => slot.time === newSlot)) {
      this.showError('Ese horario ya existe');
      return;
    }

    const nextSlots = [...this.slots.map(slot => slot.time), newSlot].sort();

    if (!this.hasValidDistance(nextSlots)) {
      this.showError('Debe haber al menos 30 minutos entre horarios');
      return;
    }

    const slot: ScheduleSlot = { time: newSlot, occupied: false, presence: 'ALL' };

    this.slots = [...this.slots, slot]
      .sort((a, b) => a.time.localeCompare(b.time));
    this.newSlotTime = null;
  }

  removeSlot(slot: ScheduleSlot) {
    if (slot.occupied) return;

    this.slots = this.slots.filter(item => item.time !== slot.time);
  }

  saveSchedule() {
    if (this.savingSchedule) return;

    if (this.scheduleMode === 'RANGE' && !this.hasCompleteRange()) {
      this.showError('Selecciona una fecha de inicio y una fecha de fin');
      return;
    }

    if (this.slots.length === 0) {
      this.showError('Debe quedar al menos un horario');
      return;
    }

    if (this.hasScheduleConflicts()) {
      this.showError('Hay horarios con menos de 30 minutos de diferencia');
      return;
    }

    const payload: ScheduleSettingsRequest = {
      mode: this.scheduleMode,
      slots: this.getSlotTimes(this.slots)
    };

    if (this.scheduleMode === 'DATE') {
      payload.date = this.formatControlDate(this.scheduleForm.get('date')!.value);
    }

    if (this.scheduleMode === 'RANGE') {
      payload.startDate = this.formatControlDate(this.scheduleForm.get('startDate')!.value);
      payload.endDate = this.formatControlDate(this.scheduleForm.get('endDate')!.value);
    }

    this.savingSchedule = true;
    this.settingsService.putSchedule(payload).pipe(
      finalize(() => this.savingSchedule = false)
    ).subscribe({
      next: schedule => {
        this.slots = schedule.slots;
        this.savedScheduleSlots = this.getSlotTimes(this.slots);
        this.showSuccess('Horarios guardados correctamente');
      },
      error: error => this.showError(error?.error?.message ?? 'No se pudieron guardar los horarios')
    });
  }

  hasScheduleChanges(): boolean {
    return this.getSlotTimes(this.slots).join('|') !== this.savedScheduleSlots.join('|');
  }

  hasScheduleConflicts(): boolean {
    return this.slots.some(slot => this.isConflictingSlot(slot.time));
  }

  isConflictingSlot(time: string): boolean {
    const times = this.getSlotTimes(this.slots);
    const index = times.indexOf(time);

    if (index === -1) return false;

    const previous = times[index - 1];
    const next = times[index + 1];

    return (!!previous && this.minutesBetween(previous, time) < 30)
      || (!!next && this.minutesBetween(time, next) < 30);
  }

  private getReferenceDate(): string {
    if (this.scheduleMode === 'RANGE') {
      return this.formatControlDate(this.scheduleForm.get('startDate')!.value);
    }

    return this.formatControlDate(this.scheduleForm.get('date')!.value);
  }

  onRangeStartDateSelected() {
    const startDate = this.scheduleForm.get('startDate')!.value;
    const endDate = this.scheduleForm.get('endDate')!.value;

    if (startDate && endDate && this.toDate(startDate).getTime() > this.toDate(endDate).getTime()) {
      this.scheduleForm.get('endDate')!.setValue(null);
      this.slots = [];
      return;
    }

    this.loadSchedule();
  }

  onRangeEndDateSelected() {
    if (!this.hasCompleteRange()) {
      this.slots = [];
      return;
    }

    this.loadSchedule();
  }

  private getScheduleRequest() {
    if (this.scheduleMode === 'DEFAULT') {
      return this.settingsService.getDefaultSchedule();
    }

    if (this.scheduleMode === 'RANGE') {
      return this.settingsService.getScheduleRange(
        this.formatControlDate(this.scheduleForm.get('startDate')!.value),
        this.formatControlDate(this.scheduleForm.get('endDate')!.value)
      );
    }

    return this.settingsService.getSchedule(this.getReferenceDate());
  }

  private hasCompleteRange(): boolean {
    return !!this.scheduleForm.get('startDate')!.value && !!this.scheduleForm.get('endDate')!.value;
  }

  getMinRangeEndDate(): Date {
    const startDate = this.scheduleForm.get('startDate')!.value;

    if (!startDate) return this.minScheduleDate;

    const parsedStartDate = this.toDate(startDate);
    return parsedStartDate.getTime() > this.minScheduleDate.getTime()
      ? parsedStartDate
      : this.minScheduleDate;
  }

  private toDate(value: Date | string): Date {
    if (value instanceof Date) return value;

    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private hasValidDistance(times: string[]): boolean {
    for (let i = 1; i < times.length; i++) {
      if (this.minutesBetween(times[i - 1], times[i]) < 30) return false;
    }

    return true;
  }

  minutesBetween(start: string, end: string): number {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  }

  private getSlotTimes(slots: ScheduleSlot[]): string[] {
    return slots.map(slot => slot.time).sort();
  }

  private getDefaultEmployeeScheduleDays(): EmployeeScheduleDayView[] {
    return this.employeeScheduleDayOrder.map(dayOfWeek => ({
      dayOfWeek,
      enabled: false,
      startTime: '10:00',
      endTime: '20:00',
      startTimeDate: this.timeStringToDate('10:00'),
      endTimeDate: this.timeStringToDate('20:00')
    }));
  }

  private normalizeEmployeeScheduleDays(days: EmployeeScheduleDay[]): EmployeeScheduleDayView[] {
    const source = new Map(days.map(day => [day.dayOfWeek, day]));

    return this.employeeScheduleDayOrder.map(dayOfWeek => {
      const day = source.get(dayOfWeek);
      const startTime = day?.startTime?.slice(0, 5) || '10:00';
      const endTime = day?.endTime?.slice(0, 5) || '20:00';

      return {
        dayOfWeek,
        enabled: Boolean(day?.enabled),
        startTime,
        endTime,
        startTimeDate: this.timeStringToDate(startTime),
        endTimeDate: this.timeStringToDate(endTime)
      };
    });
  }

  private getEmployeeScheduleSignature(): string {
    return this.employeeScheduleDays
      .map(day => `${day.dayOfWeek}:${day.enabled ? '1' : '0'}:${day.startTime}:${day.endTime}`)
      .join('|');
  }

  private getEmployeeSchedulePayload(): EmployeeScheduleDay[] {
    return this.employeeScheduleDays.map(day => ({
      dayOfWeek: day.dayOfWeek,
      enabled: day.enabled,
      startTime: day.startTime,
      endTime: day.endTime
    }));
  }

  private timeStringToDate(time: string): Date {
    const [hours, minutes] = (time || '00:00').split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);

    return date;
  }

  private normalizeAmount(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;

    return Number(value);
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${MM}-${dd}`;
  }

  private formatControlDate(value: Date | string | null): string {
    if (!value) return this.formatDate(new Date());
    if (typeof value === 'string') return value;

    return this.formatDate(value);
  }

  private formatTime(date: Date): string {
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${HH}:${mm}`;
  }

  private showSuccess(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'Exito', detail });
  }

  private showError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
