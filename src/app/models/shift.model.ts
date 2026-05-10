import { ClientResponse } from './client.model';

export interface CreationShiftRequest {
  datetime: string;
  clientId: number;
  estimatedAmount?: number | null;
  status?: ShiftStatus;
}

export interface ShiftResponse {
  id: number;
  datetime: string;
  clientId: number;
  status: ShiftStatus;
  estimatedAmount?: number | null;
}

export interface ShiftCompleteResponse {
  id: number;
  datetime: string;
  client: ClientResponse;
  status: ShiftStatus;
  estimatedAmount?: number | null;
}

export interface TimeSlotAvailabilityResponse {
  time: string;
  available: boolean;
}

export interface AgendaSlotResponse {
  time: string;
  available: boolean;
  shift: ShiftCompleteResponse | null;
}

export type ShiftStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
