import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ClientResponse } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css'
})
export class ClientDetailComponent implements OnInit {

  client: ClientResponse | null = null;
  loading = false;
  showNotesConfirmation = false;
  readonly emptyValue = '\u2014';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || isNaN(id)) {
      this.router.navigate(['/clients-view']);
      return;
    }

    this.loading = true;
    this.clientService.getClientById(id).subscribe({
      next: client => {
        this.client = client;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el cliente'
        });
        this.router.navigate(['/clients-view']);
      }
    });
  }

  getClientPrimary(): string {
    if (!this.client) return this.emptyValue;

    const fullName = this.getFullName();
    return fullName || this.client.phoneNumber || this.client.email || this.emptyValue;
  }

  getFullName(): string {
    if (!this.client) return '';

    return [this.client.firstName, this.client.lastName].filter(Boolean).join(' ');
  }

  getResponsibleName(): string {
    if (!this.client || this.client.selfResponsible !== false) return this.emptyValue;

    return this.client.responsibleContactName || this.emptyValue;
  }

  getSelfResponsibleLabel(): string {
    if (!this.client) return this.emptyValue;

    return this.client.selfResponsible === false ? 'Responsable externo' : 'Responsable propio';
  }

  goBack(): void {
    this.router.navigate(['/clients-view']);
  }

  editClient(): void {
    if (!this.client) return;

    this.router.navigate(['/edit-client', this.client.id]);
  }

  goToStats(): void {
    if (!this.client) return;

    this.router.navigate(['/dashboard/clients'], {
      queryParams: { clientId: this.client.id }
    });
  }

  openNotesConfirmation(): void {
    if (!this.client) return;

    this.showNotesConfirmation = true;
  }

  closeNotesConfirmation(): void {
    this.showNotesConfirmation = false;
  }

  confirmOpenNotes(): void {
    if (!this.client) return;

    this.showNotesConfirmation = false;
    this.router.navigate(['/clients', this.client.id, 'notes'], {
      queryParams: { returnTo: 'detail' }
    });
  }
}
