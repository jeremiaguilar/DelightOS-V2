const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const newInterfaces = `
export interface CashRegister {
  id: string;
  branch_id: string;
  opened_by: string;
  opened_at: string;
  initial_cash: number;
  status: 'OPEN' | 'CLOSED';
  closed_at?: string;
  closed_by?: string;
  expected_cash?: number;
  actual_cash?: number;
  cash_difference?: number;
  notes?: string;
}

export interface CashMovement {
  id: string;
  register_id: string;
  type: 'IN' | 'OUT';
  amount: number;
  reason: string;
  user_id: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  ingredient_id: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  provider?: string;
  invoice_number?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}
`;

code = code + newInterfaces;
fs.writeFileSync('src/types.ts', code);
