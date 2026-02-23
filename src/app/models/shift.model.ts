import { ClientResponse } from './client.model';

export interface CreationShiftRequest {
  datetime: string;
  clientId: number;
  status: string;
}

export interface ShiftResponse {
  id: number;
  datetime: string;
  clientId: number;
  status: string;
}

export interface ShiftCompleteResponse {
  id: number;
  datetime: string;
  client: ClientResponse;
  status: string;
}
