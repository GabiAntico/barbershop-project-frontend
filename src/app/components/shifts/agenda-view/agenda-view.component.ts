import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AgendaSlotResponse, ShiftStatus } from '../../../models/shift.model';
import { ClientResponse } from '../../../models/client.model';
import { ShiftService } from '../../../services/shift.service';

@Component({
  selector: 'app-agenda-view',
  imports: [
    NgClass
  ],
  templateUrl: './agenda-view.component.html',
  styleUrl: './agenda-view.component.css',
  standalone: true
})
export class AgendaViewComponent implements OnInit {

  selectedDate = new Date();
  slots: AgendaSlotResponse[] = [];
  loading = false;

  readonly statusLabels: Record<ShiftStatus, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };

  constructor(
    private shiftService: ShiftService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam) {
      this.selectedDate = this.parseDateParam(dateParam);
    }

    this.loadAgenda();
  }

  loadAgenda() {
    this.loading = true;
    this.shiftService.getAgendaByDate(this.formatDate(this.selectedDate)).subscribe({
      next: slots => {
        this.slots = slots;
        this.loading = false;
      },
      error: () => {
        this.slots = [];
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la agenda'
        });
      }
    });
  }

  previousDay() {
    this.selectedDate = this.addDays(this.selectedDate, -1);
    this.loadAgenda();
  }

  nextDay() {
    this.selectedDate = this.addDays(this.selectedDate, 1);
    this.loadAgenda();
  }

  goToday() {
    this.selectedDate = new Date();
    this.loadAgenda();
  }

  goToCreateShift(slot: AgendaSlotResponse) {
    this.router.navigate(['/create-shift'], {
      queryParams: {
        date: this.formatDate(this.selectedDate),
        time: slot.time,
        returnTo: 'agenda',
        returnDate: this.formatDate(this.selectedDate)
      }
    });
  }

  goToEditShift(id: number) {
    this.router.navigate(['/edit-shift', id]);
  }

  goToCreateVisit(id: number) {
    this.router.navigate(['/visits/create', id], {
      queryParams: {
        returnTo: 'agenda',
        returnDate: this.formatDate(this.selectedDate)
      }
    });
  }

  sendWhatsAppReminder(slot: AgendaSlotResponse): void {
    if (!this.canSendWhatsAppReminder(slot)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Turno pasado',
        detail: 'No se puede enviar un recordatorio para un turno que ya paso'
      });
      return;
    }

    const client = slot.shift?.client;
    const phoneNumber = this.normalizePhoneNumber(client?.phoneNumber);

    if (!phoneNumber) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Telefono faltante',
        detail: 'El cliente no tiene un telefono valido para enviar WhatsApp'
      });
      return;
    }

    const firstName = client?.firstName?.trim();
    const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
    const message = `${greeting} te recordamos que tenés un turno el ${this.getReminderDateText(slot.time)} a las ${slot.time}.`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener');
  }

  canSendWhatsAppReminder(slot: AgendaSlotResponse): boolean {
    if (!slot.shift) return false;

    const slotTime = this.getSlotDateTime(slot.time).getTime();

    return !Number.isNaN(slotTime) && slotTime >= Date.now();
  }

  sendWhatsAppReminderForShift(shift: AgendaSlotResponse['shift'], time: string): void {
    if (!shift || !this.canSendWhatsAppReminderForShift(shift, time)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Turno pasado',
        detail: 'No se puede enviar un recordatorio para un turno que ya paso'
      });
      return;
    }

    const client = shift.client;
    const phoneNumber = this.normalizePhoneNumber(client?.phoneNumber);

    if (!phoneNumber) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Telefono faltante',
        detail: 'El cliente no tiene un telefono valido para enviar WhatsApp'
      });
      return;
    }

    const firstName = client?.firstName?.trim();
    const greeting = firstName ? `Hola ${firstName},` : 'Hola,';
    const message = `${greeting} te recordamos que tenes un turno el ${this.getReminderDateText(time)} a las ${time}.`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener');
  }

  canSendWhatsAppReminderForShift(shift: AgendaSlotResponse['shift'], time: string): boolean {
    if (!shift) return false;

    const slotTime = this.getSlotDateTime(time).getTime();

    return !Number.isNaN(slotTime) && slotTime >= Date.now();
  }

  getClientName(client: ClientResponse | null | undefined): string {
    if (!client) return '\u2014';

    return [client.firstName, client.lastName].filter(Boolean).join(' ') || '\u2014';
  }

  getStatusLabel(status: ShiftStatus): string {
    return this.statusLabels[status];
  }

  getEmployeeLabel(shift: AgendaSlotResponse['shift']): string {
    if (!shift?.assignedEmployee) return '\u2014';

    return shift.assignedEmployee.displayName || shift.assignedEmployee.email || '\u2014';
  }

  getCapacityLabel(slot: AgendaSlotResponse): string {
    if (slot.totalCapacity <= 0) return 'Sin barberos asignados';

    return `${slot.availableCount}/${slot.totalCapacity} cupos libres`;
  }

  getDisplayDate(): string {
    return this.selectedDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
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

  private normalizePhoneNumber(phoneNumber: string | null | undefined): string {
    return (phoneNumber ?? '').replace(/\D/g, '');
  }

  private getSlotDateTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(this.selectedDate);
    date.setHours(hours, minutes, 0, 0);

    return date;
  }

  private getReminderDateText(time: string): string {
    const slotDate = this.getSlotDateTime(time);
    const weekday = slotDate.toLocaleDateString('es-AR', { weekday: 'long' });

    if (this.isToday(slotDate)) {
      return 'hoy';
    }

    const fullDate = slotDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return `${weekday}, ${fullDate}`;
  }

  private isToday(date: Date): boolean {
    const today = new Date();

    return date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  }
}
