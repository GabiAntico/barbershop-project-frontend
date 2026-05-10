import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ClientRequest, ClientResponse, CreationClientRequest} from '../models/client.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) { }

  postClient(client: CreationClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(`${this.baseUrl}/clients`, client);
  }

  getAllClients(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(`${this.baseUrl}/clients`);
  }

  getClientById(id: number): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${this.baseUrl}/clients/${id}`);
  }

  putClient(clientRequest: ClientRequest): Observable<ClientResponse> {
    return this.http.put<ClientResponse>(`${this.baseUrl}/clients`, clientRequest);
  }
}
