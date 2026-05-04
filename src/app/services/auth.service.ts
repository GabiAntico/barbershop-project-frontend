import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly authUrl = environment.baseUrl.replace(/\/api$/, '') + '/auth';
  private readonly tokenKey = 'auth_token';

  constructor(private http: HttpClient) { }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, request).pipe(
      tap(response => this.setToken(response.token))
    );
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/register`, request);
  }

  setToken(token: string): void {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;

    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    if (typeof localStorage === 'undefined') return;

    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
