import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {CreationShiftRequest, ShiftCompleteResponse, ShiftResponse} from '../models/shift.model';
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
}
