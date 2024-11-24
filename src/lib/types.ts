export type GroupMember = {
  id: string;
  full_name: string;
  email: string;
};

export interface Expense {
  id: string;
  creatorName: string;
  expenseName: string;
  cost: number;
  date: string;
  category: string;
  location: string;
  payers: Payer[];
  receipt_url?: string;
}

export interface ExpenseItem {
  name: string;
  cost: number;
  location: string;
  category: string;
  payers: string[];
  attachment?: File;
  creator: string;
  receipt_url?: string;
}

export type Payer = {
  id: string;
  full_name: string;
  email: string;
  amount: number;
  isCreator: boolean;
};
