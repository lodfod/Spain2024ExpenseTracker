export type GroupMember = {
  id: string;
  full_name: string;
  email: string;
};

export interface Expense {
  id: string;
  expenseName: string;
  creatorName: string;
  cost: number;
  date: string;
  category: string;
  location: string;
  payers: ProcessedPayer[];
  receipt_url?: string;
  creator: string;
  original_currency: Currency;
  original_amount: number;
}

export interface ExpenseItem {
  name: string;
  cost: number;
  location: string;
  category: string;
  payers: string[];
  creator: string;
  receipt_url?: string;
  original_currency: Currency;
  original_amount: number;
}

export type Payer = {
  id: string;
  full_name: string;
  email: string;
  amount: number;
  isCreator: boolean;
};

export interface PayerAmount {
  expense_id: string;
  user_id: string;
  amount: number;
}

export interface ProcessedPayer {
  id: string;
  full_name: string;
  amount: number;
}

export interface ProcessedExpense {
  id: string;
  expenseName: string;
  creatorName: string;
  cost: number;
  date: string;
  category: string;
  location: string;
  payers: ProcessedPayer[];
  receipt_url?: string;
  original_currency: "EUR" | "USD";
  original_amount: number;
  creator: string;
}

export type Currency = "EUR" | "USD";
