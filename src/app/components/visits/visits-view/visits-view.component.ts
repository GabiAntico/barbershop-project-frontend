import { NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { VisitResponse } from '../../../models/visit.model';
import { VisitService } from '../../../services/visit.service';

type PaymentStatusFilter = 'ALL' | string;

@Component({
  selector: 'app-visits-view',
  standalone: true,
  imports: [TableModule, SelectButtonModule, FormsModule, InputText, NgClass],
  templateUrl: './visits-view.component.html',
  styleUrl: './visits-view.component.css'
})
export class VisitsViewComponent implements OnInit {

  visits: VisitResponse[] = [];
  private originalSorted: VisitResponse[] = [];

  selectedPaymentStatusFilter: PaymentStatusFilter = 'ALL';
  private lastPaymentStatus: PaymentStatusFilter = 'ALL';

  readonly paymentStatusFilterOptions: { label: string; value: PaymentStatusFilter }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'Pagados', value: 'PAID' },
    { label: 'Parciales', value: 'PARTIAL' },
    { label: 'Reembolsados', value: 'REFUNDED' },
    { label: 'Bonificados', value: 'BONIFIED' },
  ];

  readonly paymentStatusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    PARTIAL: 'Parcial',
    REFUNDED: 'Reembolsado',
    BONIFIED: 'Bonificado',
  };

  readonly paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
    CARD: 'Tarjeta',
  };

  constructor(private visitService: VisitService, private router: Router) {}

  ngOnInit(): void {
    this.visitService.getAllVisits().subscribe({
      next: data => {
        this.originalSorted = this.sortVisits(data);
        this.applyPaymentStatusFilter();
      },
      error: err => console.error(err)
    });
  }

  goToCreateShift(): void {
    this.router.navigate(['/create-shift']);
  }

  editVisit(id: number): void {
    this.router.navigate(['/visits/edit', id]);
  }

  getPaymentStatusLabel(status: string): string {
    return this.paymentStatusLabels[status] ?? status ?? '-';
  }

  getPaymentMethodLabel(method: string | null): string {
    if (!method) return '-';

    return this.paymentMethodLabels[method] ?? method ?? '-';
  }

  onPaymentStatusChange(event: any): void {
    const value: PaymentStatusFilter | null = event?.value ?? null;

    if (value === null) {
      setTimeout(() => {
        this.selectedPaymentStatusFilter = this.lastPaymentStatus;
        this.applyPaymentStatusFilter();
      }, 0);
      return;
    }

    this.selectedPaymentStatusFilter = value;
    this.lastPaymentStatus = value;
    this.applyPaymentStatusFilter();
  }

  resetFilters(table: any): void {
    this.selectedPaymentStatusFilter = 'ALL';
    this.lastPaymentStatus = 'ALL';
    this.applyPaymentStatusFilter();

    table.sortField = null;
    table.sortOrder = 0;
    table.clear();
  }

  private applyPaymentStatusFilter(): void {
    if (this.selectedPaymentStatusFilter === 'ALL') {
      this.visits = [...this.originalSorted];
      return;
    }

    this.visits = this.originalSorted.filter(v => v.paymentStatus === this.selectedPaymentStatusFilter);
  }

  private parseDate(datetime: string | null): number {
    if (!datetime) return Number.NEGATIVE_INFINITY;

    const time = new Date(datetime).getTime();
    return isNaN(time) ? Number.NEGATIVE_INFINITY : time;
  }

  private sortVisits(visits: VisitResponse[]): VisitResponse[] {
    return [...visits].sort((a, b) => this.parseDate(b.paidAt) - this.parseDate(a.paidAt));
  }
}
