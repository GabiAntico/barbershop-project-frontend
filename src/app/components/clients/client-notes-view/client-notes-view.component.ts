import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientResponse } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-client-notes-view',
  imports: [
    RouterLink
  ],
  templateUrl: './client-notes-view.component.html',
  styleUrl: './client-notes-view.component.css',
  standalone: true
})
export class ClientNotesViewComponent implements OnInit {

  client: ClientResponse | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private messageService: MessageService
  ) { }

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
          detail: 'No se pudieron cargar las notas del cliente'
        });
        this.router.navigate(['/clients-view']);
      }
    });
  }

  getClientLabel(): string {
    if (!this.client) return '\u2014';

    const fullName = [this.client.firstName, this.client.lastName].filter(Boolean).join(' ');
    return fullName || this.client.phoneNumber || this.client.email || '\u2014';
  }

  goBack(): void {
    if (!this.client) {
      this.router.navigate(['/clients-view']);
      return;
    }

    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (returnTo === 'detail') {
      this.router.navigate(['/clients', this.client.id]);
      return;
    }

    this.router.navigate(['/dashboard/clients'], {
      queryParams: { clientId: this.client.id }
    });
  }
}
