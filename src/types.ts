export type FBAccountStatus = 'ACTIVE' | 'DISABLED' | 'UNSETTLED' | 'IN_REVIEW' | 'PENDING_CLOSURE';
export type InventoryStatus = 'IN_STOCK' | 'OUT_OF_STOCK';
export type AccountType = 'Cá nhân' | 'BM1' | 'BM3' | 'BM5' | 'VO' | 'REGULAR' | 'NOLIMIT' | string;
export type AccountScope = 'BM' | 'PERSONAL';

export interface Partner {
  id: string;
  name: string;
}

export interface AuditLog {
  action: 'IMPORT' | 'UPDATE' | 'DELETE' | string;
  user: string;
  timestamp: string;
  details: string;
}

export interface AdAccount {
  id: string;
  name: string;
  fbStatus: FBAccountStatus;
  inventoryStatus: InventoryStatus;
  importDate: string; // ISO String
  exportDate?: string | null; // ISO String
  linkedPartners: Partner[];
  paymentCard?: string; // Last 4 digits e.g. "VISA 1234"
  limit: number; // Daily spend limit in USD. -1 for No Limit.
  accountType: AccountType;
  accountScope: AccountScope;
  timezone: string;
  currency: string;
  spend: number;
  blueWhaleSync?: boolean;
  createdBy?: string;
  auditLogs?: AuditLog[];
}

export type FilterState = {
  searchQuery: string;
  searchField: string;
  accountTypes: AccountType[];
  inventoryStatus: InventoryStatus | 'ALL';
  fbStatus: FBAccountStatus | 'ALL';
  dateRange: { start: string | null; end: string | null };
};
