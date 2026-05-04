import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {CreationVisitRequest, VisitResponse} from '../models/visit.model';

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
}
