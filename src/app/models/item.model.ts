export type Category = 'Cocoa'|'Coffee'|'Palm Oil'|'Cotton'|'Cassava'|'Maize'|'Seeds'|'Fertilizers'|'Equipment'|'Livestock Feed'|'Cattle'|'Goats'|'Poultry'|'Pigs'|'Sheep';

export interface InventoryItem {
lastUpdated: string|number|Date;
  item: any;
  supplier: any;
  quantity: number;
  id: string;
  name: string;
  category: Category;
  quantityLabel: string; // e.g. "168.3 MT" or "5,000 units"
  quantityValue?: number; // numeric quantity for sorting/logic
  minLabel?: string; // e.g. "Min: 50 MT"
  valueXaf: string; // formatted money string
  location: string;
  status: 'In Stock'|'Low Stock'|'Critical';
  trend?: 'up'|'down'|'flat';
}
