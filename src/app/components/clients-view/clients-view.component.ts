import {Component, OnInit} from '@angular/core';
import {Router} from 'express';
import {ClientService} from '../../services/client.service';
import {ClientResponse} from '../../models/client.model';
import {Listbox} from 'primeng/listbox';
import {FormsModule} from '@angular/forms';
import {PrimeTemplate} from 'primeng/api';

@Component({
  selector: 'app-clients-view',
  imports: [
    Listbox,
    FormsModule,
    PrimeTemplate
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
}
