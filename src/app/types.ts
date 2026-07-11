export type Priority = "high" | "normal" | "low";

export interface OrderItem {
  id: string;
  productName: string;
  quantityOrdered: number;
  shipped: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  datePlaced: string; // ISO yyyy-mm-dd
  notes: string | null;
  priority: Priority;
  archived: boolean;
  dateArchived: string | null;
  shipmentIds: string[];
  items: OrderItem[];
}

export interface ShipmentItem {
  productName: string;
  quantityOrdered: number;
}

export interface Shipment {
  id: string;
  type: "shipment";
  orderId: string;
  customerName: string;
  shipmentNumber: number;
  shippedAt: string; // ISO timestamp
  items: ShipmentItem[];
}

export interface Customer {
  id: string;
  name: string;
}
