export interface VisitResponse {
  id: number;
  shiftId: number;
  totalAmount: number;
  currency: string | null;
  paymentStatus: string;
  paidAt: string | null;
  paymentMethod: string | null;
}

export interface CreationVisitRequest {
  shiftId: number;
  totalAmount: number;
  currency: string | null;
  paymentStatus: string;
  paidAt: string | null;
  paymentMethod: string | null;
}

export interface UpdateVisitRequest {
  totalAmount: number;
  currency: string | null;
  paymentStatus: string;
  paidAt: string | null;
  paymentMethod: string | null;
}
