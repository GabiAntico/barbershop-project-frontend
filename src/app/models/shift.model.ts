import { ClientResponse } from './client.model';

export interface CreationShiftRequest {
  datetime: string;
  clientId: number;
  assignedEmployeeId?: number | null;
  estimatedAmount?: number | null;
  status?: ShiftStatus;
}

export interface ShiftEmployeeResponse {
  id: number;
  displayName?: string | null;
  email: string;
}

export interface ShiftResponse {
  id: number;
  datetime: string;
  clientId: number;
  assignedEmployeeId?: number | null;
  assignedEmployee?: ShiftEmployeeResponse | null;
  status: ShiftStatus;
  estimatedAmount?: number | null;
}

export interface ShiftCompleteResponse {
  id: number;
  datetime: string;
  client: ClientResponse;
  assignedEmployee?: ShiftEmployeeResponse | null;
  status: ShiftStatus;
  estimatedAmount?: number | null;
}

export interface TimeSlotAvailabilityResponse {
  time: string;
  available: boolean;
  availableCount: number;
  totalCapacity: number;
  availableEmployeeIds: number[];
}

export interface AgendaSlotResponse {
  time: string;
  available: boolean;
  availableCount: number;
  totalCapacity: number;
  shift: ShiftCompleteResponse | null;
  shifts: ShiftCompleteResponse[];
}

export type ShiftStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
