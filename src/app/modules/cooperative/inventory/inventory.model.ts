export interface InventoryItem {
  id?: string;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  valueXAF: number;
  location: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK';
  trend: 'UP' | 'DOWN' | 'STABLE';
  itemType?: 'FARMER_PRODUCT' | 'INPUT_SUPPLY' | 'LIVESTOCK';
  // Extended fields for different types
  grade?: string;
  quality?: string;
  supplier?: string;
  batchNumber?: string;
  breed?: string;
  ageGroup?: string;
}

export interface InventorySummary {
  totalInventoryValue: number;
  farmerProductsStock: number;
  inputSuppliesCount: number;
  criticalStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalItems: number;
  percentageChange: number;
}