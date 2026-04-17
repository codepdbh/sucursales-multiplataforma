export type UserRole = 'OWNER' | 'ADMIN' | 'REGISTRADOR';
export type MovementType = 'IN' | 'OUT';

export interface Branch {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  branch: Branch | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  brand: {
    id: string;
    name: string;
  };
  name: string;
  barcode: string | null;
  requiresWeight: boolean;
  defaultPrice: number;
  photoUrl: string | null;
  siatEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
  id: string;
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  brandName: string;
  quantity: number;
}

export interface InventoryMovement {
  id: string;
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  unitPrice: number | null;
  refType: string | null;
  refId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  branchId: string;
  branchName: string;
  userId: string;
  username: string;
  subtotal: number;
  discount: number;
  total: number;
  invoiceEnabled: boolean;
  siatStatus: string;
  notes: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LiquidationReport {
  periodStart: string;
  periodEnd: string;
  incomeTotal: number;
  outputTotal: number;
  netTotal: number;
  salesCount: number;
  movementsCount: number;
}

export interface SalesEditControl {
  id: string;
  branchId: string;
  enabled: boolean;
  expiresAt: string | null;
  createdById: string;
  createdAt: string;
}

export interface ImportProductsResult {
  createdProducts: number;
  updatedProducts: number;
  stockRowsProcessed: number;
  branchId: string;
}
