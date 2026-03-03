import { ClientResponse } from './client.model';

export interface CreationShiftRequest {
  datetime: string;
  clientId: number;
  status?: ShiftStatus;
}

export interface ShiftResponse {
  id: number;
  datetime: string;
  clientId: number;
  status: ShiftStatus;
}

export interface ShiftCompleteResponse {
  id: number;
  datetime: string;
  client: ClientResponse;
  status: ShiftStatus;
}

export type ShiftStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
