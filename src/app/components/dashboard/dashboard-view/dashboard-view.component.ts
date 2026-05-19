import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { DashboardResponse } from '../../../models/dashboard.model';
import { DashboardService } from '../../../services/dashboard.service';

type DashboardRange = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

@Component({
  selector: 'app-dashboard-view',
  imports: [
    FormsModule,
    DatePicker
  ],
  templateUrl: './dashboard-view.component.html',
  styleUrl: './dashboard-view.component.css',
  standalone: true
})
export class DashboardViewComponent implements OnInit {

  dashboard: DashboardResponse | null = null;
  selectedRange: DashboardRange = 'TODAY';
  startDate = new Date();
  endDate = new Date();
  loading = false;

  readonly rangeOptions: { label: string; value: DashboardRange }[] = [
    { label: 'Hoy', value: 'TODAY' },
    { label: 'Esta semana', value: 'WEEK' },
    { label: 'Este mes', value: 'MONTH' },
    { label: 'Rango', value: 'CUSTOM' }
  ];

  constructor(
    private dashboardService: DashboardService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.applyRange('TODAY');
  }

  applyRange(range: DashboardRange) {
    this.selectedRange = range;
    const today = new Date();

    if (range === 'TODAY') {
      this.startDate = new Date(today);
      this.endDate = new Date(today);
    }

    if (range === 'WEEK') {
      const day = today.getDay() === 0 ? 6 : today.getDay() - 1;
      this.startDate = this.addDays(today, -day);
      this.endDate = new Date(today);
    }

    if (range === 'MONTH') {
      this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      this.endDate = new Date(today);
    }

    if (range !== 'CUSTOM') {
      this.loadDashboard();
    }
  }

  loadDashboard() {
    if (this.endDate < this.startDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La fecha de fin no puede ser menor que la fecha de inicio'
      });
      return;
    }

    this.loading = true;
    this.dashboardService.getDashboard(this.formatDate(this.startDate), this.formatDate(this.endDate)).subscribe({
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
          detail: 'No se pudo cargar el dashboard'
        });
      }
    });
  }

  formatMoney(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(value ?? 0);
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
}
