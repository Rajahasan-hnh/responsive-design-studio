export type TxType = "income" | "expense";

export interface Profile {
  id: string;
  full_name: string;
  currency: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category_id: string | null;
  occurred_on: string;
  note: string | null;
}

export interface Category {
  id: string;
  name: string;
  kind: TxType;
  color: string;
}

export interface Budget {
  id: string;
  category_id: string;
  monthly_limit: number;
  month: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  icon: string;
}
