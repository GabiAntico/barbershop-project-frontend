import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import {TableModule} from 'primeng/table';
import {InputText} from 'primeng/inputtext';
import {ShiftService} from '../../../services/shift.service';
import {ShiftCompleteResponse} from '../../../models/shift.model';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-shifts-view',
  imports: [
    TableModule,
    InputText,
    NgClass
  ],
  templateUrl: './shifts-view.component.html',
  standalone: true,
  styleUrl: './shifts-view.component.css'
})
export class ShiftsViewComponent implements OnInit {

  shifts: ShiftCompleteResponse[] = [];
  originalSorted: ShiftCompleteResponse[] = [];

  constructor(private shiftService: ShiftService, private router: Router) { }

  ngOnInit() {
    this.shiftService.getAllCompleteShifts().subscribe({
      next: data => {
        this.originalSorted = this.sortUpcomingThenPast(data);
        this.shifts = [...this.originalSorted];
      },
      error: err => {
        console.error(err);
      }
    });
  }

  goToCreateShift(){
    this.router.navigate(['/create-shift']);
  }

  viewShift(id: number){

  }

  editShift(id: number){
    this.router.navigate(['/edit-shift', id]);
  }

  private parseShiftDate(datetime: string): Date | null {
    if (!datetime) return null;

    if (datetime.includes('T')) {
      const d = new Date(datetime);
      return isNaN(d.getTime()) ? null : d;
    }

    const [datePart, timePart] = datetime.split(' ');
    if (!datePart || !timePart) return null;

    const [y, m, day] = datePart.split('-').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);

    const d = new Date(y, m - 1, day, hh, mm, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  private sortUpcomingThenPast(shifts: any[]): any[] {
    const now = Date.now();

    const parsed = shifts.map(s => ({
      s,
      t: this.parseShiftDate(s.datetime)?.getTime() ?? null
    }));

    const valid = parsed.filter(x => x.t !== null) as { s: any; t: number }[];
    const invalid = parsed.filter(x => x.t === null).map(x => x.s); // por si hay data rara

    const upcoming = valid
      .filter(x => x.t >= now)
      .sort((a, b) => a.t - b.t)   // más cercano primero
      .map(x => x.s);

    const past = valid
      .filter(x => x.t < now)
      .sort((a, b) => b.t - a.t)   // más reciente pasado primero
      .map(x => x.s);

    return [...upcoming, ...past, ...invalid];
  }

  resetSmartSort(table: any) {
    this.shifts = [...this.originalSorted];

    table.sortField = null;
    table.sortOrder = 0;

    table.clear();
  }
}
