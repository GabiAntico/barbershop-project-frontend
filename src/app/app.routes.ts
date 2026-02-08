import { Routes } from '@angular/router';
import {CreateClientComponent} from './components/create-client/create-client.component';
import {ClientsViewComponent} from './components/clients-view/clients-view.component';
import {CreateShiftComponent} from './components/create-shift/create-shift.component';

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
    path: 'create-shift', component: CreateShiftComponent
  }
];
