export interface CreationClientRequest {
  email: string | null;
  phoneNumber: string;
  selfResponsible: boolean;
  responsibleContactName: string | null;
  firstName: string | null;
  lastName: string | null;
  documentNumber: string | null;
  notes: string | null;
}

export interface ClientRequest {
  id: number;
  firstName: string | null;
  lastName: string | null;
  documentNumber: string | null;
  email: string | null;
  phoneNumber: string;
  selfResponsible: boolean;
  responsibleContactName: string | null;
  notes: string | null;
}

export interface ClientResponse {
  id: number;
  email: string | null;
  phoneNumber: string | null;
  selfResponsible: boolean | null;
  responsibleContactName: string | null;
  firstName: string | null;
  lastName: string | null;
  documentNumber: string | null;
  notes: string | null;
}
