import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import {TableModule} from 'primeng/table';
import {InputText} from 'primeng/inputtext';
import {ShiftService} from '../../services/shift.service';
import {ShiftCompleteResponse} from '../../models/shift.model';

@Component({
  selector: 'app-shifts-view',
  imports: [
    TableModule,
    InputText
  ],
  templateUrl: './shifts-view.component.html',
  standalone: true,
  styleUrl: './shifts-view.component.css'
})
export class ShiftsViewComponent implements OnInit {

  shifts: ShiftCompleteResponse[] = [];

  constructor(private shiftService: ShiftService, private router: Router) { }

  ngOnInit() {
    this.shiftService.getAllCompleteShifts().subscribe({
      next: data => {
        this.shifts = data;
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

  }
}
