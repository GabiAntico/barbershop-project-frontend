import { ClientResponse } from './client.model';

export interface VisitResponse {
  id: number;
  shiftId: number;
  client: ClientResponse | null;
  attendedByUserId: number | null;
  attendedByName: string | null;
  attendedByEmail: string | null;
  totalAmount: number;
  currency: string | null;
  paymentStatus: string;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentMethodSummary?: string;
  grossPaidAmount: number;
  refundedAmount: number;
  bonifiedAmount: number;
  netPaidAmount: number;
  coveredAmount: number;
  pendingAmount: number;
  paymentMovements: VisitPaymentMovementResponse[];
}

export type VisitPaymentMovementType = 'PAYMENT' | 'REFUND' | 'BONIFICATION';

export interface VisitPaymentMovementRequest {
  type: VisitPaymentMovementType;
  amount: number;
  occurredAt: string;
  paymentMethod: string | null;
  notes: string | null;
}

export interface VisitPaymentMovementResponse extends VisitPaymentMovementRequest {
  id: number;
}

export interface CreationVisitRequest {
  shiftId: number;
  totalAmount: number;
  paymentMovements: VisitPaymentMovementRequest[];
}

export interface UpdateVisitRequest {
  totalAmount: number;
  paymentMovements: VisitPaymentMovementRequest[];
}
