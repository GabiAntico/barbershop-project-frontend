import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NgClass} from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgClass],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'shifts-frontend';

  selectedOption!: number;

  constructor(private router: Router) { }

  ngOnInit() {
    this.selectedOption = 0;
  }

  changeOption(option: number) {
    this.selectedOption = option;

    if(option === 0) {
      this.router.navigate(['/create-client']);
    }
    else if(option === 1) {
      this.router.navigate(['/clients-view']);
    }
    else{
      this.router.navigate(['/create-shift']);
    }
  }
}
