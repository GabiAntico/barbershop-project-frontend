import {Component, OnInit} from '@angular/core';
import {NavigationEnd, RouterLink, RouterOutlet} from '@angular/router';
import {NgClass} from '@angular/common';
import { Router } from '@angular/router';
import {filter} from 'rxjs';
import {ToastModule} from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgClass, RouterLink, ToastModule],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'shifts-frontend';
  sidebarOpen = false;

  selectedOption!: number;

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.sidebarOpen = false;
      });
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  // changeOption(option: number) {
  //   this.selectedOption = option;
  //
  //   if(option === 0) {
  //     this.router.navigate(['/create-client']);
  //   }
  //   else if(option === 1) {
  //     this.router.navigate(['/clients-view']);
  //   }
  //   else{
  //     this.router.navigate(['/create-shift']);
  //   }
  // }
}
