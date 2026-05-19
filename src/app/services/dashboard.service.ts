import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardResponse } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getDashboard(startDate: string, endDate: string): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/dashboard`, {
      params: { startDate, endDate }
    });
  }
}
