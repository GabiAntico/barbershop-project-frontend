import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {CreationVisitRequest, UpdateVisitRequest, VisitResponse} from '../models/visit.model';

@Injectable({
  providedIn: 'root'
})
export class VisitService {

  baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getAllVisits(): Observable<VisitResponse[]> {
    return this.http.get<VisitResponse[]>(`${this.baseUrl}/visits`);
  }

  postVisit(visitRequest: CreationVisitRequest): Observable<VisitResponse> {
    return this.http.post<VisitResponse>(`${this.baseUrl}/visits`, visitRequest);
  }

  getVisitById(id: number): Observable<VisitResponse> {
    return this.http.get<VisitResponse>(`${this.baseUrl}/visits/${id}`);
  }

  putVisit(id: number, visitRequest: UpdateVisitRequest): Observable<VisitResponse> {
    return this.http.put<VisitResponse>(`${this.baseUrl}/visits/${id}`, visitRequest);
  }
}
