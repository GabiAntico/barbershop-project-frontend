import { ClientResponse } from './client.model';

export interface CreationShiftRequest {
  datetime: string;
  clientId: number;
}

export interface ShiftResponse {
  id: number;
  datetime: string;
  clientId: number;
}

export interface ShiftCompleteResponse {
  id: number;
  datetime: string;
  client: ClientResponse;
}
