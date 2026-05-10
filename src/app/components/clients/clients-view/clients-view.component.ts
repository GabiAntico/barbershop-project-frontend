import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientService } from '../../../services/client.service';
import { ClientResponse } from '../../../models/client.model';
import { FormsModule } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'app-clients-view',
  imports: [
    FormsModule,
    PrimeTemplate,
    TableModule,
    InputText
  ],
  templateUrl: './clients-view.component.html',
  standalone: true,
  styleUrl: './clients-view.component.css'
})
export class ClientsViewComponent implements OnInit {

  clients: ClientResponse[] = [];

  selectedClientId: number = 0;

  constructor(private clientService: ClientService, private router: Router) { }

  ngOnInit() {
    this.clientService.getAllClients().subscribe({
      next: data => {
        this.clients = data;
      }
    })
  }

  goToCreateClient(){
    this.router.navigate(['/create-client']);
  }

  viewClient(id: number) {

  }

  getClientName(client: ClientResponse): string {
    return [client.firstName, client.lastName].filter(Boolean).join(' ') || '—';
  }

  editClient(id: number){
    this.router.navigate(['/edit-client/' + id]);
  }
}
