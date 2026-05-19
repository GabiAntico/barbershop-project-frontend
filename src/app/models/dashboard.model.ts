export interface DashboardResponse {
  revenue: RevenueStats;
  attendance: AttendanceStats;
}

export interface RevenueStats {
  totalPaidAmount: number;
  paidVisitsCount: number;
  averageTicket: number;
}

export interface AttendanceStats {
  completed: number;
  cancelled: number;
  missed: number;
  futurePending: number;
  totalEvaluated: number;
  attendanceRate: number;
}
