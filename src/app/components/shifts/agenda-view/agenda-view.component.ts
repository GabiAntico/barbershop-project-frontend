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

  getClientName(client: ClientResponse | null | undefined): string {
    if (!client) return '-';

    return [client.firstName, client.lastName].filter(Boolean).join(' ') || '-';
  }

  getStatusLabel(status: ShiftStatus): string {
    return this.statusLabels[status];
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
}
