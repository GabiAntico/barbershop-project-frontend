import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppSettings, AppSettingsRequest } from '../models/settings.model';

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
}
