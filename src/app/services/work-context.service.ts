import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Branch,
  CreateBranchRequest,
  CreateEmployeeRequest,
  Employee,
  EmployeeSchedule,
  EmployeeScheduleRequest,
  UpdateEmployeeBranchesRequest,
  WorkContext
} from '../models/work-context.model';

@Injectable({
  providedIn: 'root'
})
export class WorkContextService {

  private readonly baseUrl = `${environment.baseUrl}/work-context`;
  private readonly branchKey = 'active_branch_id';
  private readonly contextSubject = new BehaviorSubject<WorkContext | null>(null);
  private readonly activeBranchSubject = new BehaviorSubject<Branch | null>(null);

  context$ = this.contextSubject.asObservable();
  activeBranch$ = this.activeBranchSubject.asObservable();

  constructor(private http: HttpClient) { }

  loadContext(): Observable<WorkContext> {
    return this.http.get<WorkContext>(this.baseUrl).pipe(
      tap(context => {
        this.contextSubject.next(context);
        this.ensureActiveBranch(context);
      })
    );
  }

  getContextValue(): WorkContext | null {
    return this.contextSubject.value;
  }

  getActiveBranchId(): number | null {
    if (typeof localStorage === 'undefined') return null;

    const stored = localStorage.getItem(this.branchKey);
    return stored ? Number(stored) : null;
  }

  setActiveBranch(branchId: number): void {
    const context = this.contextSubject.value;
    const branch = context?.branches.find(item => item.id === Number(branchId)) ?? null;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.branchKey, String(branchId));
    }

    this.activeBranchSubject.next(branch);
  }

  clear(): void {
    this.contextSubject.next(null);
    this.activeBranchSubject.next(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.branchKey);
    }
  }

  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.baseUrl}/branches`);
  }

  createBranch(request: CreateBranchRequest): Observable<Branch> {
    return this.http.post<Branch>(`${this.baseUrl}/branches`, request);
  }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/employees`);
  }

  createEmployee(request: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/employees`, request);
  }

  updateEmployeeBranches(employeeId: number, request: UpdateEmployeeBranchesRequest): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/employees/${employeeId}/branches`, request);
  }

  getEmployeeSchedule(employeeId: number, branchId: number): Observable<EmployeeSchedule> {
    return this.http.get<EmployeeSchedule>(`${this.baseUrl}/employees/${employeeId}/schedule`, {
      params: { branchId }
    });
  }

  updateEmployeeSchedule(employeeId: number, request: EmployeeScheduleRequest): Observable<EmployeeSchedule> {
    return this.http.put<EmployeeSchedule>(`${this.baseUrl}/employees/${employeeId}/schedule`, request);
  }

  private ensureActiveBranch(context: WorkContext): void {
    const storedBranchId = this.getActiveBranchId();
    const selectedBranch = context.branches.find(branch => branch.id === storedBranchId)
      ?? context.branches[0]
      ?? null;

    if (selectedBranch) {
      this.setActiveBranch(selectedBranch.id);
      return;
    }

    this.activeBranchSubject.next(null);
  }
}
