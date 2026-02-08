export interface CreationClientRequest {
  firstName: string;
  lastName: string;
  documentNumber: string;
}

export interface ClientResponse {
  id: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
}
