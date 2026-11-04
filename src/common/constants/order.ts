import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["PENDING", "SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["PENDING"],
  REFUNDED: [],
};

/** Stock is held by an order in every status except these. */
const STOCK_RELEASED_STATUSES: readonly OrderStatus[] = ["CANCELLED", "REFUNDED"];

export function orderHoldsStock(status: OrderStatus): boolean {
  return !STOCK_RELEASED_STATUSES.includes(status);
}
