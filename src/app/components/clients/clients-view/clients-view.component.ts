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
  searchTerm = '';
  mobilePage = 0;
  readonly mobileRows = 8;

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
    this.router.navigate(['/clients', id]);
  }

  getClientName(client: ClientResponse): string {
    return [client.firstName, client.lastName].filter(Boolean).join(' ') || '\u2014';
  }

  getClientPrimary(client: ClientResponse): string {
    return [client.firstName, client.lastName].filter(Boolean).join(' ')
      || client.phoneNumber
      || client.email
      || '\u2014';
  }

  getResponsibleName(client: ClientResponse): string {
    return client.selfResponsible === false ? (client.responsibleContactName || '\u2014') : '\u2014';
  }

  get filteredClients(): ClientResponse[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.clients;

    return this.clients.filter(client => [
      client.firstName,
      client.lastName,
      client.responsibleContactName,
      client.email,
      client.phoneNumber
    ].some(value => (value || '').toLowerCase().includes(term)));
  }

  get mobileClients(): ClientResponse[] {
    const start = this.mobilePage * this.mobileRows;

    return this.filteredClients.slice(start, start + this.mobileRows);
  }

  get mobileTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredClients.length / this.mobileRows));
  }

  get mobileFirstRecord(): number {
    return this.filteredClients.length === 0 ? 0 : (this.mobilePage * this.mobileRows) + 1;
  }

  get mobileLastRecord(): number {
    return Math.min((this.mobilePage + 1) * this.mobileRows, this.filteredClients.length);
  }

  onSearch(value: string, table: any): void {
    this.searchTerm = value;
    this.mobilePage = 0;
    table.filterGlobal(value, 'contains');
  }

  previousMobilePage(): void {
    this.mobilePage = Math.max(0, this.mobilePage - 1);
  }

  nextMobilePage(): void {
    this.mobilePage = Math.min(this.mobileTotalPages - 1, this.mobilePage + 1);
  }

  editClient(id: number){
    this.router.navigate(['/edit-client/' + id]);
  }
}
