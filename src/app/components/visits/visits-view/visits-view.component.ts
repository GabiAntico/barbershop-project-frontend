import { NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { VisitResponse } from '../../../models/visit.model';
import { ClientResponse } from '../../../models/client.model';
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
  searchTerm = '';
  mobilePage = 0;
  readonly mobileRows = 8;

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

  getAttendedByLabel(visit: VisitResponse): string {
    return visit.attendedByName || visit.attendedByEmail || '-';
  }

  getClientLabel(client: ClientResponse | null): string {
    if (!client) return '-';

    const fullName = [client.firstName, client.lastName].filter(Boolean).join(' ');
    const contact = client.email ? `${client.phoneNumber} - ${client.email}` : client.phoneNumber;

    return fullName ? `${fullName} - ${client.phoneNumber}` : contact || '-';
  }

  getClientPrimary(client: ClientResponse | null): string {
    if (!client) return '-';

    return [client.firstName, client.lastName].filter(Boolean).join(' ')
      || client.phoneNumber
      || client.email
      || '-';
  }

  get filteredVisits(): VisitResponse[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.visits;

    return this.visits.filter(visit => [
      this.getClientLabel(visit.client),
      this.getAttendedByLabel(visit),
      visit.currency,
      this.getPaymentStatusLabel(visit.paymentStatus),
      visit.paymentStatus,
      this.getPaymentMethodLabel(visit.paymentMethod),
      visit.paymentMethod
    ].some(value => (value || '').toLowerCase().includes(term)));
  }

  get mobileVisits(): VisitResponse[] {
    const start = this.mobilePage * this.mobileRows;

    return this.filteredVisits.slice(start, start + this.mobileRows);
  }

  get mobileTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredVisits.length / this.mobileRows));
  }

  get mobileFirstRecord(): number {
    return this.filteredVisits.length === 0 ? 0 : (this.mobilePage * this.mobileRows) + 1;
  }

  get mobileLastRecord(): number {
    return Math.min((this.mobilePage + 1) * this.mobileRows, this.filteredVisits.length);
  }

  onSearch(value: string, table: any): void {
    this.searchTerm = value;
    this.mobilePage = 0;
    table.filterGlobal(value, 'contains');
  }

  previousMobilePage(): void {
    this.mobilePage = Math.max(0, this.mobilePage - 1);
  }

  nextMobilePage(): void {
    this.mobilePage = Math.min(this.mobileTotalPages - 1, this.mobilePage + 1);
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
      this.mobilePage = 0;
      return;
    }

    this.visits = this.originalSorted.filter(v => v.paymentStatus === this.selectedPaymentStatusFilter);
    this.mobilePage = 0;
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
