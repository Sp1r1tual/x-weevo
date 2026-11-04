import { prisma } from "@/libs/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";

import { ORDER_STATUS_TRANSITIONS, orderHoldsStock } from "@/common/constants/order";
import { DomainError } from "@/common/utils/action-result";

import {
  AdminOrderData,
  CreateOrderInput,
  OrderData,
  UpdateOrderContactData,
} from "@/types/order.types";

export * from "@/types/order.types";

const orderItemSelect = {
  id: true,
  productId: true,
  variantId: true,
  productNameUk: true,
  productNameEn: true,
  productSize: true,
  productColor: true,
  price: true,
  quantity: true,
  variant: { select: { colorUk: true, colorEn: true } },
  product: {
    select: {
      slug: true,
      images: {
        where: { isPrimary: true },
        select: { url: true, altText: true },
        take: 1,
      },
    },
  },
} as const;

const baseOrderSelect = {
  id: true,
  status: true,
  totalAmount: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  carrier: true,
  shippingAddress: true,
  trackingNumber: true,
  note: true,
  discountAmount: true,
  createdAt: true,
  updatedAt: true,
  items: { select: orderItemSelect },
} as const;

const adminOrderSelect = {
  ...baseOrderSelect,
  userId: true,
  user: {
    select: {
      name: true,
      email: true,
      phone: true,
    },
  },
} as const;

const stockItemSelect = {
  variantId: true,
  quantity: true,
  productNameUk: true,
  productNameEn: true,
} as const;

const CUSTOMER_EDITABLE_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING"];

type StockItem = {
  variantId: string | null;
  quantity: number;
  productNameUk: string;
  productNameEn: string;
};

async function restoreStock(tx: Prisma.TransactionClient, items: StockItem[]) {
  for (const item of items) {
    if (!item.variantId) continue;

    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/** The stock check and decrement are one statement, so concurrent orders cannot oversell. */
async function reserveStock(tx: Prisma.TransactionClient, items: StockItem[]) {
  for (const item of items) {
    if (!item.variantId) continue;

    const { count } = await tx.productVariant.updateMany({
      where: { id: item.variantId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });

    if (count === 0) {
      throw new DomainError("outOfStock", {
        nameUk: item.productNameUk,
        nameEn: item.productNameEn,
      });
    }
  }
}

export async function getOrdersByUserId(userId: string): Promise<OrderData[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: baseOrderSelect,
    orderBy: { createdAt: "desc" },
  });

  return orders;
}

export async function getOrderById(orderId: string, userId: string): Promise<OrderData | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: baseOrderSelect,
  });
  if (!order) return null;
  return order;
}

export async function updateOrderContact(
  orderId: string,
  userId: string,
  data: UpdateOrderContactData,
): Promise<OrderData> {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, userId, status: { in: CUSTOMER_EDITABLE_STATUSES } },
    data: {
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      shippingAddress: data.shippingAddress,
    },
  });

  if (count === 0) throw new Error("Order not found or cannot be edited in its current status");

  return prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: baseOrderSelect });
}

export async function cancelOrder(orderId: string, userId: string): Promise<OrderData> {
  return prisma.$transaction(async (tx) => {
    // The status check is part of the update, so a repeated cancel cannot restock twice.
    const { count } = await tx.order.updateMany({
      where: { id: orderId, userId, status: { in: CUSTOMER_EDITABLE_STATUSES } },
      data: { status: "CANCELLED" },
    });

    if (count === 0) {
      throw new Error("Order not found or cannot be cancelled in its current status");
    }

    const items = await tx.orderItem.findMany({ where: { orderId }, select: stockItemSelect });
    await restoreStock(tx, items);

    return tx.order.findUniqueOrThrow({ where: { id: orderId }, select: baseOrderSelect });
  });
}

export async function getAllOrdersAdmin(): Promise<AdminOrderData[]> {
  const orders = await prisma.order.findMany({
    select: adminOrderSelect,
    orderBy: { createdAt: "desc" },
  });

  return orders;
}

export async function getOrderByIdAdmin(orderId: string): Promise<AdminOrderData | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    select: adminOrderSelect,
  });

  return order;
}

export async function updateOrderStatusAdmin(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string | null,
): Promise<AdminOrderData> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, items: { select: stockItemSelect } },
  });

  if (!order) throw new Error("Order not found");

  if (status !== order.status && !ORDER_STATUS_TRANSITIONS[order.status].includes(status)) {
    throw new DomainError("orderTransitionInvalid");
  }

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status,
        ...(trackingNumber !== undefined ? { trackingNumber } : {}),
      },
    });

    if (count === 0) throw new DomainError("orderChanged");

    const heldStock = orderHoldsStock(order.status);
    const holdsStock = orderHoldsStock(status);

    if (heldStock && !holdsStock) {
      await restoreStock(tx, order.items);
    } else if (!heldStock && holdsStock) {
      await reserveStock(tx, order.items);
    }

    return tx.order.findUniqueOrThrow({ where: { id: orderId }, select: adminOrderSelect });
  });
}

export async function createOrder(input: CreateOrderInput): Promise<OrderData> {
  const products = await prisma.product.findMany({
    where: {
      id: { in: input.items.map((item) => item.productId) },
      status: "PUBLISHED",
      deletedAt: null,
    },
    select: { id: true, price: true, discountPrice: true, variants: { select: { id: true } } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalInKopecks = 0;

  const orderItems = input.items.map((item) => {
    const names = { nameUk: item.productNameUk, nameEn: item.productNameEn };
    const dbProduct = productMap.get(item.productId);

    if (!dbProduct) throw new DomainError("productUnavailable", names);

    const isVariantValid = dbProduct.variants.some((v) => v.id === item.variantId);
    if (dbProduct.variants.length > 0 && !isVariantValid) {
      throw new DomainError("sizeRequired", names);
    }

    const price = dbProduct.discountPrice ?? dbProduct.price;
    totalInKopecks += Math.round(price * 100) * item.quantity;

    return {
      productId: item.productId,
      variantId: item.variantId,
      productNameUk: item.productNameUk,
      productNameEn: item.productNameEn,
      productSize: item.productSize,
      productColor: item.productColor,
      price,
      quantity: item.quantity,
    };
  });

  return prisma.$transaction(async (tx) => {
    // Removing the cart rows first turns a double submit into an error instead of a second order.
    const { count } = await tx.cartItem.deleteMany({
      where: {
        id: { in: input.items.map((item) => item.cartItemId) },
        cart: { userId: input.userId },
      },
    });

    if (count !== input.items.length) throw new DomainError("cartChanged");

    await reserveStock(tx, orderItems);

    return tx.order.create({
      data: {
        userId: input.userId,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        carrier: input.carrier,
        shippingAddress: input.shippingAddress,
        totalAmount: totalInKopecks / 100,
        items: { create: orderItems },
      },
      select: baseOrderSelect,
    });
  });
}
