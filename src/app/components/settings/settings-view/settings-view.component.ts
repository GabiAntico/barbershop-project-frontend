import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { SettingsService } from '../../../services/settings.service';
import { ScheduleSlot, ScheduleSettingsRequest } from '../../../models/settings.model';

type SettingsTab = 'amount' | 'schedule';
type ScheduleMode = 'DATE' | 'RANGE' | 'DEFAULT';

@Component({
  selector: 'app-settings-view',
  imports: [
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    InputText,
    DatePicker
  ],
  templateUrl: './settings-view.component.html',
  styleUrl: './settings-view.component.css',
  standalone: true
})
export class SettingsViewComponent implements OnInit {

  amountForm!: FormGroup;
  scheduleForm!: FormGroup;
  savedDefaultEstimatedAmount: number | null = null;

  activeTab: SettingsTab = 'amount';
  scheduleMode: ScheduleMode = 'DATE';
  slots: ScheduleSlot[] = [];
  savedScheduleSlots: string[] = [];
  newSlotTime: Date | null = null;
  loadingSchedule = false;
  minScheduleDate = new Date();

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.amountForm = this.fb.group({
      defaultEstimatedAmount: [0, [Validators.min(0)]]
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
        this.amountForm.patchValue({
          defaultEstimatedAmount: this.savedDefaultEstimatedAmount
        });
      },
      error: () => this.showError('No se pudo cargar la configuracion')
    });

    this.loadSchedule();
  }

  saveSettings(form: FormGroup) {
    if (form.invalid) {
      form.markAllAsTouched();
      this.showError('Formulario invalido');
      return;
    }

    const amount = form.get('defaultEstimatedAmount')!.value;

    this.settingsService.putSettings({
      defaultEstimatedAmount: amount === null || amount === '' ? 0 : Number(amount)
    }).subscribe({
      next: settings => {
        this.savedDefaultEstimatedAmount = settings.defaultEstimatedAmount ?? 0;
        this.amountForm.patchValue({
          defaultEstimatedAmount: this.savedDefaultEstimatedAmount
        });
        this.showSuccess('Configuracion guardada correctamente');
      },
      error: () => this.showError('No se pudo guardar la configuracion')
    });
  }

  hasSettingsChanges(): boolean {
    return this.normalizeAmount(this.amountForm.get('defaultEstimatedAmount')?.value) !== this.normalizeAmount(this.savedDefaultEstimatedAmount);
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab = tab;
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

    this.settingsService.putSchedule(payload).subscribe({
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

  private minutesBetween(start: string, end: string): number {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  }

  private getSlotTimes(slots: ScheduleSlot[]): string[] {
    return slots.map(slot => slot.time).sort();
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
