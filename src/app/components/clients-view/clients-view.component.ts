import {Component, OnInit} from '@angular/core';
import {Router} from 'express';
import {ClientService} from '../../services/client.service';
import {ClientResponse} from '../../models/client.model';
import {Listbox} from 'primeng/listbox';
import {FormsModule} from '@angular/forms';
import {PrimeTemplate} from 'primeng/api';
import {TableModule} from 'primeng/table';
import {InputText} from 'primeng/inputtext';

@Component({
  selector: 'app-clients-view',
  imports: [
    Listbox,
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

  constructor(private clientService: ClientService) { }

  ngOnInit() {
    this.clientService.getAllClients().subscribe({
      next: data => {
        this.clients = data;
      }
    })
  }

  goToCreateClient(){

  }

  viewClient(id: number) {

  }

  editClient(id: number){

  }
}
