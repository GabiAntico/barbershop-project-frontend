export interface AppSettings {
  defaultEstimatedAmount: number | null;
  defaultCurrency: string | null;
}

export interface AppSettingsRequest {
  defaultEstimatedAmount: number | null;
  defaultCurrency: string;
}

export interface ScheduleSlot {
  time: string;
  occupied: boolean;
  presence?: 'ALL' | 'PARTIAL';
}

export interface ScheduleSettings {
  date: string;
  slots: ScheduleSlot[];
}

export interface ScheduleSettingsRequest {
  mode: 'DATE' | 'RANGE' | 'DEFAULT';
  date?: string;
  startDate?: string;
  endDate?: string;
  slots: string[];
}
