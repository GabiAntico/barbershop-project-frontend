import { Routes } from '@angular/router';
import {CreateClientComponent} from './components/clients/create-client/create-client.component';
import {ClientsViewComponent} from './components/clients/clients-view/clients-view.component';
import {CreateShiftComponent} from './components/shifts/create-shift/create-shift.component';
import {ShiftsViewComponent} from './components/shifts/shifts-view/shifts-view.component';
import {EditClientComponent} from './components/clients/edit-client/edit-client.component';
import {EditShiftComponent} from './components/shifts/edit-shift/edit-shift.component';

export const routes: Routes = [
  {
    path: '', pathMatch: 'full', redirectTo: 'create-client',
  },
  {
    path: 'create-client', component: CreateClientComponent
  },
  {
    path: 'clients-view', component: ClientsViewComponent
  },
  {
    path: 'edit-client/:id', component: EditClientComponent
  },
  {
    path: 'create-shift', component: CreateShiftComponent
  },
  {
    path: 'shifts-view', component: ShiftsViewComponent
  },
  {
    path: 'edit-shift/:id', component: EditShiftComponent
  }
];
