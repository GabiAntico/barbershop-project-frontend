import {Component, OnInit} from '@angular/core';
import {NavigationEnd, RouterLink, RouterOutlet} from '@angular/router';
import {NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { Router } from '@angular/router';
import {filter} from 'rxjs';
import {ToastModule} from 'primeng/toast';
import {Select} from 'primeng/select';
import {AuthService} from './services/auth.service';
import {WorkContextService} from './services/work-context.service';
import {Branch, WorkContext} from './models/work-context.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgClass, RouterLink, ToastModule, FormsModule, Select],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'shifts-frontend';
  sidebarOpen = false;
  hideShell = false;
  context: WorkContext | null = null;
  activeBranch: Branch | null = null;
  selectedBranchId: number | null = null;

  selectedOption!: number;

  constructor(
    private router: Router,
    private authService: AuthService,
    private workContextService: WorkContextService
  ) { }

  ngOnInit() {
    this.updateShellVisibility(this.router.url);

    this.workContextService.context$.subscribe(context => {
      this.context = context;
    });
    this.workContextService.activeBranch$.subscribe(branch => {
      this.activeBranch = branch;
      this.selectedBranchId = branch?.id ?? null;
    });

    if (this.authService.isLoggedIn()) {
      this.loadContext();
    }

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.updateShellVisibility((event as NavigationEnd).urlAfterRedirects);
        this.sidebarOpen = false;
        if (this.authService.isLoggedIn() && !this.context) {
          this.loadContext();
        }
      });
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  getCurrentSectionLabel(): string {
    if (this.isActive('/login')) return 'Iniciar sesion';
    if (this.isActive('/register')) return 'Crear cuenta';
    if (this.isActive('/change-password')) return 'Cambiar contraseña';
    if (this.isActive('/access-denied')) return 'Acceso denegado';
    if (this.isActive('/dashboard/clients')) return 'Estadisticas por cliente';
    if (this.isActive('/dashboard')) return 'Estadisticas';
    if (this.isActive('/agenda')) return 'Agenda';
    if (this.isActive('/create-client')) return 'Crear clientes';
    if (this.router.url.includes('/clients/') && this.router.url.includes('/notes')) return 'Notas internas';
    if (/^\/clients\/\d+($|[?#])/.test(this.router.url)) return 'Detalle cliente';
    if (this.isActive('/clients-view')) return 'Ver clientes';
    if (this.isActive('/create-shift')) return 'Cargar turnos';
    if (this.isActive('/shifts-view')) return 'Ver turnos';
    if (this.isActive('/visits-view')) return 'Ver visitas';
    if (this.isActive('/settings')) return 'Configuracion';

    return 'Turnos';
  }

  getTopbarTitle(): string {
    if (this.isLoggedIn()) {
      return this.context?.barbershopName || 'Barberia';
    }

    return 'Barberia';
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
    this.workContextService.clear();
    this.router.navigate(['/login']);
  }

  onBranchSelected(branchId: number | string | null): void {
    if (!branchId) return;

    this.workContextService.setActiveBranch(Number(branchId));
    if (typeof window !== 'undefined' && this.authService.isLoggedIn()) {
      window.location.reload();
    }
  }

  private loadContext(): void {
    this.workContextService.loadContext().subscribe({
      error: () => {
        this.context = null;
        this.activeBranch = null;
      }
    });
  }

  private updateShellVisibility(url: string): void {
    const path = url.split(/[?#]/)[0];
    this.hideShell = ['/login', '/register', '/change-password'].some(route => path === route);

    if (this.hideShell) {
      this.sidebarOpen = false;
    }
  }
}
