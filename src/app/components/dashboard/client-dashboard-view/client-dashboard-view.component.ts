import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgStyle } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { ClientResponse } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import { DashboardService } from '../../../services/dashboard.service';
import { AttendanceStats, ClientDashboardResponse } from '../../../models/dashboard.model';

type ClientSelectOption = ClientResponse & { label: string };

@Component({
  selector: 'app-client-dashboard-view',
  imports: [
    FormsModule,
    NgClass,
    NgStyle,
    Select,
    DatePicker
  ],
  templateUrl: './client-dashboard-view.component.html',
  styleUrl: './client-dashboard-view.component.css',
  standalone: true
})
export class ClientDashboardViewComponent implements OnInit {

  clients: ClientSelectOption[] = [];
  selectedClientId: number | null = null;
  selectedMonthDate = new Date();
  dashboard: ClientDashboardResponse | null = null;
  loading = false;
  showNotesConfirmation = false;

  readonly attendanceColors = {
    completed: '#22c55e',
    cancelled: '#ef4444',
    missed: '#eab308',
    futurePending: '#64748b'
  };

  constructor(
    private clientService: ClientService,
    private dashboardService: DashboardService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe({
      next: clients => {
        const clientIdParam = Number(this.route.snapshot.queryParamMap.get('clientId'));
        this.clients = clients.map(client => ({
          ...client,
          label: this.getClientLabel(client)
        }));
        if (this.clients.length > 0) {
          this.selectedClientId = this.clients.some(client => client.id === clientIdParam)
            ? clientIdParam
            : this.clients[0].id;
          this.loadDashboard();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los clientes'
        });
      }
    });
  }

  loadDashboard(): void {
    if (!this.selectedClientId || !this.selectedMonthDate) {
      this.dashboard = null;
      return;
    }

    this.loading = true;
    this.dashboardService.getClientDashboard(this.selectedClientId, this.formatMonth(this.selectedMonthDate)).subscribe({
      next: data => {
        this.dashboard = data;
        this.loading = false;
      },
      error: () => {
        this.dashboard = null;
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las estadisticas del cliente'
        });
      }
    });
  }

  getClientLabel(client: ClientResponse): string {
    const fullName = [client.firstName, client.lastName].filter(Boolean).join(' ');
    const contact = client.phoneNumber || client.email || '';

    return fullName ? `${fullName} - ${contact}` : contact || '\u2014';
  }

  getSelectedClientName(): string {
    const client = this.dashboard?.client;
    if (!client) return '\u2014';

    const fullName = [client.firstName, client.lastName].filter(Boolean).join(' ');
    return fullName || client.phoneNumber || client.email || '\u2014';
  }

  formatMoney(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(value ?? 0);
  }

  getMonthLabel(): string {
    return this.selectedMonthDate.toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric'
    });
  }

  formatVisitDate(datetime: string | null | undefined): string {
    if (!datetime) return '\u2014';

    return new Date(datetime).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getAverageCutFrequencyLabel(): string {
    const average = this.dashboard?.visitFrequency.averageDaysBetweenVisits;

    return average ? `Cada ${average} dias` : '\u2014';
  }

  goToClientNotes(): void {
    if (!this.selectedClientId) return;

    this.showNotesConfirmation = true;
  }

  closeNotesConfirmation(): void {
    this.showNotesConfirmation = false;
  }

  confirmOpenNotes(): void {
    if (!this.selectedClientId) return;

    this.showNotesConfirmation = false;
    this.router.navigate(['/clients', this.selectedClientId, 'notes'], {
      queryParams: { returnTo: 'stats' }
    });
  }

  getPieStyle(): Record<string, string> {
    const attendance = this.dashboard?.attendance;
    if (!attendance || this.getPieTotal(attendance) === 0) {
      return { background: '#1e293b' };
    }

    const total = this.getPieTotal(attendance);
    const completed = this.percentValue(attendance.completed, total);
    const cancelled = completed + this.percentValue(attendance.cancelled, total);
    const missed = cancelled + this.percentValue(attendance.missed, total);

    return {
      background: `conic-gradient(
        ${this.attendanceColors.completed} 0% ${completed}%,
        ${this.attendanceColors.cancelled} ${completed}% ${cancelled}%,
        ${this.attendanceColors.missed} ${cancelled}% ${missed}%,
        ${this.attendanceColors.futurePending} ${missed}% 100%
      )`
    };
  }

  getAttendanceItems(): { label: string; value: number; colorClass: string }[] {
    const attendance = this.dashboard?.attendance;

    return [
      { label: 'Completados', value: attendance?.completed ?? 0, colorClass: 'bg-green-500' },
      { label: 'Cancelados', value: attendance?.cancelled ?? 0, colorClass: 'bg-red-500' },
      { label: 'Ausentes', value: attendance?.missed ?? 0, colorClass: 'bg-yellow-500' },
      { label: 'Pendientes futuros', value: attendance?.futurePending ?? 0, colorClass: 'bg-slate-500' }
    ];
  }

  private getPieTotal(attendance: AttendanceStats): number {
    return attendance.completed + attendance.cancelled + attendance.missed + attendance.futurePending;
  }

  private percentValue(value: number, total: number): number {
    return total === 0 ? 0 : (value * 100) / total;
  }

  private formatMonth(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');

    return `${yyyy}-${mm}`;
  }
}
