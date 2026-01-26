
export enum CheckType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing'
}

export enum CheckStatus {
  PENDING = 'pending',
  PAID = 'paid',
  RETURNED = 'returned',
  GARANTIE = 'garantie'
}

export enum Currency {
  EUR = 'EUR',
  MAD = 'MAD',
  USD = 'USD'
}

export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface FinancialRisk {
  id: string;
  type: 'returned' | 'overdue' | 'high_value' | 'concentration' | 'client_risk';
  level: RiskLevel;
  description: string;
  amount: number;
  relatedId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  status: 'new' | 'read' | 'closed';
  createdAt: string;
  linkId?: string;
}

export interface Check {
  id: string;
  check_number: string;
  bank_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  entity_name: string;
  type: CheckType;
  status: CheckStatus;
  fund_name?: string;
  notes?: string;
  image_url?: string;
  created_at: string;
}

export interface SystemSettings {
  company_name: string;
  currency: Currency;
  logo_url: string;
  alert_days: number;
  high_value_threshold: number;
}

export type AppTab = 'dash' | 'checks' | 'performance' | 'risks' | 'parameters';
