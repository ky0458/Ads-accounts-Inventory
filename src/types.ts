export type FBAccountStatus = 'ACTIVE' | 'DISABLED' | 'UNSETTLED' | 'IN_REVIEW' | 'PENDING_CLOSURE';
export type InventoryStatus = 'IN_STOCK' | 'OUT_OF_STOCK';
export type AccountType = 'REGULAR' | 'VO' | 'NOLIMIT';
export type AccountScope = 'BM' | 'PERSONAL';

export interface Partner {
  id: string;
  name: string;
}

export interface AdAccount {
  id: string;
  name: string;
  fbStatus: FBAccountStatus;
  inventoryStatus: InventoryStatus;
  importDate: string; // ISO String
  exportDate?: string; // ISO String
  linkedPartners: Partner[];
  paymentCard?: string; // Last 4 digits e.g. "VISA 1234"
  limit: number; // Daily spend limit in USD. -1 for No Limit.
  accountType: AccountType;
  accountScope: AccountScope;
  timezone: string;
  currency: string;
  spend: number;
  blueWhaleSync?: boolean;
}

export type FilterState = {
  searchQuery: string;
  searchField: string;
  accountTypes: AccountType[];
  inventoryStatus: InventoryStatus | 'ALL';
  fbStatus: FBAccountStatus | 'ALL';
  dateRange: { start: string | null; end: string | null };
};
