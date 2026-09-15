export interface Participant {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export type GroupType = 'costing' | 'business';

export interface GroupMember {
  participantId: string;
  percentage?: number;
  shares?: number;
}

export interface Group {
  id: string;
  name: string;
  type?: GroupType;
  description?: string;
  defaultCurrencyCode: string;
  participantIds: string[];
  members?: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer' | 'withdrawal';

export interface Split {
  participantId: string;
  amount: bigint; // Minor units
  percentage?: number;
  shares?: number;
}

export interface Transaction {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  type: TransactionType;
  amount: bigint; // Minor units
  currencyCode: string;
  payerId: string;
  splits: Split[];
  date: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ledger {
  id: string;
  title: string;
  groups: Group[];
  participants: Participant[];
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}
