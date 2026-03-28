import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';

import { ShiftService } from '../../../services/shift.service';
import { ShiftCompleteResponse, ShiftStatus } from '../../../models/shift.model';

type StatusFilter = 'ALL' | ShiftStatus;

@Component({
  selector: 'app-shifts-view',
  standalone: true,
  imports: [TableModule, SelectButtonModule, FormsModule, NgClass],
  templateUrl: './shifts-view.component.html',
  styleUrl: './shifts-view.component.css',
})
export class ShiftsViewComponent implements OnInit {

  shifts: ShiftCompleteResponse[] = [];
  private originalSorted: ShiftCompleteResponse[] = [];

  selectedStatusFilter: StatusFilter = 'ALL';
  private lastStatus: StatusFilter = 'ALL';

  readonly statusFilterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'Completados', value: 'COMPLETED' },
    { label: 'Cancelados', value: 'CANCELLED' },
  ];

  readonly statusLabels: Record<ShiftStatus, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };

  getStatusLabel(status: ShiftStatus): string {
    return this.statusLabels[status];
  }

  constructor(private shiftService: ShiftService, private router: Router) {}

  ngOnInit(): void {
    this.shiftService.getAllCompleteShifts().subscribe({
      next: data => {
        this.originalSorted = this.sortByGroups(data);

        this.applyStatusFilter();
      },
      error: err => console.error(err)
    });
  }

  goToCreateShift(): void {
    this.router.navigate(['/create-shift']);
  }

  editShift(id: number): void {
    this.router.navigate(['/edit-shift', id]);
  }

  // ------------------- SelectButton (filtro) -------------------
  /**
   * Se ejecuta cuando cambia el SelectButton.
   * Si value === null (se intentó deseleccionar), restauramos el último.
   */
  onStatusChange(event: any): void {
    const value: StatusFilter | null = event?.value ?? null;

    if (value === null) {
      setTimeout(() => {
        this.selectedStatusFilter = this.lastStatus;
        this.applyStatusFilter();
      }, 0);
      return;
    }

    this.selectedStatusFilter = value;
    this.lastStatus = value;
    this.applyStatusFilter();
  }

  private applyStatusFilter(): void {
    if (this.selectedStatusFilter === 'ALL') {
      this.shifts = [...this.originalSorted];
      return;
    }
    this.shifts = this.originalSorted.filter(s => s.status === this.selectedStatusFilter);
  }

  resetSmartSort(table: any): void {
    this.selectedStatusFilter = 'ALL';
    this.lastStatus = 'ALL';
    this.applyStatusFilter();

    table.sortField = null;
    table.sortOrder = 0;
    table.clear();
  }

  private parseShiftDate(datetime: string): number {
    const d = new Date(datetime);
    const t = d.getTime();
    return isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }

  private groupPriority(status: ShiftStatus, t: number, now: number): number {
    const isFutureOrNow = t >= now;

    if (isFutureOrNow && status === 'PENDING') return 0;
    if (isFutureOrNow && (status === 'COMPLETED' || status === 'CANCELLED')) return 1;
    return 2;
  }

  private sortByGroups(shifts: ShiftCompleteResponse[]): ShiftCompleteResponse[] {
    const now = Date.now();

    return [...shifts].sort((a, b) => {
      const ta = this.parseShiftDate(a.datetime);
      const tb = this.parseShiftDate(b.datetime);

      const ga = this.groupPriority(a.status, ta, now);
      const gb = this.groupPriority(b.status, tb, now);

      if (ga !== gb) return ga - gb;

      if (ga === 2) return tb - ta;

      return ta - tb;
    });
  }

  goToCreateVisit(id: number): void {
    this.router.navigate(['/visits/create', id]);
  }

}
