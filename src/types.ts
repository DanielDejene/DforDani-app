/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  location: string;
  unitCost: number;
  unitPrice: number;
  description?: string;
}

export interface PurchaseTransaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  supplier: string;
  status: 'Ordered' | 'Received';
  paymentAccount: string;
}

export interface SaleTransaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number; // Optional custom cost price per quintal saved with this transaction
  totalRevenue: number;
  date: string;
  customer: string;
  profit: number;
  paymentAccount: string;
  note?: string;
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: 'Inventory Sale' | 'Inventory Purchase' | 'Personal Expense' | 'Salary/Freelance' | 'Utilities' | 'Rent' | 'Investment' | 'Other Income' | 'Other Expense';
  amount: number;
  date: string;
  description: string;
  linkedId?: string; // Link to sales ID or purchase ID
  account: string;  // e.g., 'Cash Box', 'Checking Account', 'Savings', 'Credit Card'
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
}

export interface PLSummary {
  totalRevenue: number;
  totalCOGS: number; // Cost of Goods Sold
  grossProfit: number;
  operatingExpenses: number; // custom finance records expenses
  netProfit: number;
  itemSoldCount: number;
  itemPurchasedCount: number;
}

export interface ProviderDeposit {
  id: string;
  providerName: string;
  grainType: 'Waliya' | 'Evoniy' | 'Atar' | 'Bakela' | 'Sinde' | 'Ashile' | string;
  quantity: number; // no of grains in kuntal
  date: string; // YYYY-MM-DD
  storageLocation: string;
  notes?: string;
}

