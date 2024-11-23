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
}

export type Payer = {
  id: string;
  full_name: string;
  email: string;
  amount: number;
  isCreator: boolean;
};
