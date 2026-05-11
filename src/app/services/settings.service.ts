import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppSettings, AppSettingsRequest, ScheduleSettings, ScheduleSettingsRequest } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${this.baseUrl}/settings`);
  }

  putSettings(settings: AppSettingsRequest): Observable<AppSettings> {
    return this.http.put<AppSettings>(`${this.baseUrl}/settings`, settings);
  }

  getSchedule(date: string): Observable<ScheduleSettings> {
    return this.http.get<ScheduleSettings>(`${this.baseUrl}/settings/schedule`, {
      params: { date }
    });
  }

  getDefaultSchedule(): Observable<ScheduleSettings> {
    return this.http.get<ScheduleSettings>(`${this.baseUrl}/settings/schedule/default`);
  }

  getScheduleRange(startDate: string, endDate: string): Observable<ScheduleSettings> {
    return this.http.get<ScheduleSettings>(`${this.baseUrl}/settings/schedule/range`, {
      params: { startDate, endDate }
    });
  }

  putSchedule(schedule: ScheduleSettingsRequest): Observable<ScheduleSettings> {
    return this.http.put<ScheduleSettings>(`${this.baseUrl}/settings/schedule`, schedule);
  }
}
