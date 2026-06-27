import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, map } from 'rxjs';

import { ShiftService } from '../../../services/shift.service';
import { ClientService } from '../../../services/client.service';
import { ClientResponse } from '../../../models/client.model';
import { ShiftResponse, ShiftStatus } from '../../../models/shift.model';

@Component({
  selector: 'app-shift-detail',
  standalone: true,
  imports: [NgClass],
  templateUrl: './shift-detail.component.html',
  styleUrl: './shift-detail.component.css'
})
export class ShiftDetailComponent implements OnInit {

  shift: ShiftResponse | null = null;
  client: ClientResponse | null = null;
  loading = true;

  readonly statusLabels: Record<ShiftStatus, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shiftService: ShiftService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || isNaN(id)) {
      this.loading = false;
      return;
    }

    this.shiftService.getShiftById(id).pipe(
      switchMap(shift => this.clientService.getClientById(shift.clientId).pipe(
        map(client => ({ shift, client }))
      ))
    ).subscribe({
      next: ({ shift, client }) => {
        this.shift = shift;
        this.client = client;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getStatusLabel(status: ShiftStatus): string {
    return this.statusLabels[status];
  }

  getClientPrimary(): string {
    if (!this.client) return '\u2014';

    const fullName = [this.client.firstName, this.client.lastName].filter(Boolean).join(' ');

    return fullName || this.client.phoneNumber || this.client.email || '\u2014';
  }

  getAssignedEmployeeLabel(): string {
    if (!this.shift?.assignedEmployee) return '\u2014';

    return this.shift.assignedEmployee.displayName || this.shift.assignedEmployee.email || '\u2014';
  }

  formatShiftDate(datetime: string | null | undefined): string {
    if (!datetime) return '\u2014';

    return datetime.includes('T') ? datetime.split('T')[0] : datetime.split(' ')[0];
  }

  formatShiftTime(datetime: string | null | undefined): string {
    if (!datetime) return '\u2014';

    return datetime.includes('T')
      ? datetime.split('T')[1].substring(0, 5)
      : datetime.split(' ')[1] || '\u2014';
  }

  formatAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '\u2014';

    return `$ ${Number(amount).toFixed(2)}`;
  }

  goBack(): void {
    this.router.navigate(['/shifts-view']);
  }

  editShift(): void {
    if (!this.shift) return;

    this.router.navigate(['/edit-shift', this.shift.id]);
  }

  createVisit(): void {
    if (!this.shift) return;

    this.router.navigate(['/visits/create', this.shift.id], {
      queryParams: { returnTo: 'shifts' }
    });
  }
}
