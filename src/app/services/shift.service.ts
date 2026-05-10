import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {AgendaSlotResponse, CreationShiftRequest, ShiftCompleteResponse, ShiftResponse, TimeSlotAvailabilityResponse} from '../models/shift.model';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

  baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) { }

  postShift(shiftRequest: CreationShiftRequest): Observable<ShiftResponse> {
    return this.http.post<ShiftResponse>(`${this.baseUrl}/shifts`, shiftRequest);
  }

  getAllCompleteShifts(): Observable<ShiftCompleteResponse[]> {
    return this.http.get<ShiftCompleteResponse[]>(`${this.baseUrl}/shifts/complete`);
  }

  getShiftById(id: number): Observable<ShiftResponse> {
    return this.http.get<ShiftResponse>(`${this.baseUrl}/shifts/${id}`);
  }

  getAvailabilityByDate(date: string, excludeShiftId?: number): Observable<TimeSlotAvailabilityResponse[]> {
    const params: Record<string, string> = { date };

    if (excludeShiftId) {
      params['excludeShiftId'] = String(excludeShiftId);
    }

    return this.http.get<TimeSlotAvailabilityResponse[]>(`${this.baseUrl}/shifts/availability`, {
      params
    });
  }

  getAgendaByDate(date: string): Observable<AgendaSlotResponse[]> {
    return this.http.get<AgendaSlotResponse[]>(`${this.baseUrl}/shifts/agenda`, {
      params: { date }
    });
  }

  putShift(id: number, shiftRequest: CreationShiftRequest): Observable<ShiftResponse> {
    return this.http.put<ShiftResponse>(`${this.baseUrl}/shifts/${id}`, shiftRequest);
  }
}
