export interface VisitResponse {
  id: number;
  shiftId: number;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paidAt: string | null;
  paymentMethod: string | null;
}

export interface CreationVisitRequest {
  shiftId: number;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paidAt: string | null;
  paymentMethod: string | null;
}
