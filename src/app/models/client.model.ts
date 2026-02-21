export interface CreationClientRequest {
  email: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
}

export interface ClientRequest {
  id: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  email: string;
}

export interface ClientResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
}
