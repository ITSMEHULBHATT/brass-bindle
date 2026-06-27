export interface OrderItem {
  productName: string;
  quantityOrdered: number;
  quantityFulfilled: number;
}

export interface Order {
  id: string;
  customerName: string;
  datePlaced: string; // ISO yyyy-mm-dd
  items: OrderItem[];
  archived: boolean;
  archivedAt?: string;
}
