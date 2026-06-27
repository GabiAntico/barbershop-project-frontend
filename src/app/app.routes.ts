import { Routes } from '@angular/router';
import {CreateClientComponent} from './components/clients/create-client/create-client.component';
import {ClientsViewComponent} from './components/clients/clients-view/clients-view.component';
import {ClientNotesViewComponent} from './components/clients/client-notes-view/client-notes-view.component';
import {ClientDetailComponent} from './components/clients/client-detail/client-detail.component';
import {CreateShiftComponent} from './components/shifts/create-shift/create-shift.component';
import {ShiftsViewComponent} from './components/shifts/shifts-view/shifts-view.component';
import {EditClientComponent} from './components/clients/edit-client/edit-client.component';
import {EditShiftComponent} from './components/shifts/edit-shift/edit-shift.component';
import {ShiftDetailComponent} from './components/shifts/shift-detail/shift-detail.component';
import {CreateVisitComponent} from './components/visits/create-visit/create-visit.component';
import {EditVisitComponent} from './components/visits/edit-visit/edit-visit.component';
import {VisitsViewComponent} from './components/visits/visits-view/visits-view.component';
import {LoginComponent} from './components/auth/login/login.component';
import {RegisterComponent} from './components/auth/register/register.component';
import {ChangePasswordComponent} from './components/auth/change-password/change-password.component';
import {AccessDeniedComponent} from './components/auth/access-denied/access-denied.component';
import {authGuard} from './guards/auth.guard';
import {SettingsViewComponent} from './components/settings/settings-view/settings-view.component';
import {AgendaViewComponent} from './components/shifts/agenda-view/agenda-view.component';
import {DashboardViewComponent} from './components/dashboard/dashboard-view/dashboard-view.component';
import {ClientDashboardViewComponent} from './components/dashboard/client-dashboard-view/client-dashboard-view.component';

export const routes: Routes = [
  {
    path: '', pathMatch: 'full', redirectTo: 'login',
  },
  {
    path: 'login', component: LoginComponent
  },
  {
    path: 'register', component: RegisterComponent
  },
  {
    path: 'access-denied', component: AccessDeniedComponent
  },
  {
    path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard]
  },
  {
    path: 'create-client', component: CreateClientComponent, canActivate: [authGuard]
  },
  {
    path: 'dashboard', component: DashboardViewComponent, canActivate: [authGuard]
  },
  {
    path: 'dashboard/clients', component: ClientDashboardViewComponent, canActivate: [authGuard]
  },
  {
    path: 'agenda', component: AgendaViewComponent, canActivate: [authGuard]
  },
  {
    path: 'clients-view', component: ClientsViewComponent, canActivate: [authGuard]
  },
  {
    path: 'edit-client/:id', component: EditClientComponent, canActivate: [authGuard]
  },
  {
    path: 'clients/:id/notes', component: ClientNotesViewComponent, canActivate: [authGuard]
  },
  {
    path: 'clients/:id', component: ClientDetailComponent, canActivate: [authGuard]
  },
  {
    path: 'create-shift', component: CreateShiftComponent, canActivate: [authGuard]
  },
  {
    path: 'shifts-view', component: ShiftsViewComponent, canActivate: [authGuard]
  },
  {
    path: 'shifts/:id', component: ShiftDetailComponent, canActivate: [authGuard]
  },
  {
    path: 'edit-shift/:id', component: EditShiftComponent, canActivate: [authGuard]
  },
  {
    path: 'visits/create/:shiftId',
    component: CreateVisitComponent,
    canActivate: [authGuard]
  },
  {
    path: 'visits-view',
    component: VisitsViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'visits/edit/:id',
    component: EditVisitComponent,
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    component: SettingsViewComponent,
    canActivate: [authGuard]
  }
];
