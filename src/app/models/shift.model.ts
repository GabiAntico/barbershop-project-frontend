export interface CreationShiftRequest {
  datetime: string;
  clientId: number;
}

export interface ShiftResponse {
  id: number;
  datetime: string;
  clientId: number;
}
