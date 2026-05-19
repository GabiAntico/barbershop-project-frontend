import {Component, OnInit} from '@angular/core';
import {NavigationEnd, RouterLink, RouterOutlet} from '@angular/router';
import {NgClass} from '@angular/common';
import { Router } from '@angular/router';
import {filter} from 'rxjs';
import {ToastModule} from 'primeng/toast';
import {AuthService} from './services/auth.service';

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

  constructor(private router: Router, private authService: AuthService) { }

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

  getCurrentSectionLabel(): string {
    if (this.isActive('/login')) return 'Iniciar sesion';
    if (this.isActive('/register')) return 'Crear cuenta';
    if (this.isActive('/access-denied')) return 'Acceso denegado';
    if (this.isActive('/dashboard')) return 'Dashboard';
    if (this.isActive('/agenda')) return 'Agenda';
    if (this.isActive('/create-client')) return 'Crear clientes';
    if (this.isActive('/clients-view')) return 'Ver clientes';
    if (this.isActive('/create-shift')) return 'Cargar turnos';
    if (this.isActive('/shifts-view')) return 'Ver turnos';
    if (this.isActive('/visits-view')) return 'Ver visitas';
    if (this.isActive('/settings')) return 'Configuracion';

    return 'Turnos';
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
