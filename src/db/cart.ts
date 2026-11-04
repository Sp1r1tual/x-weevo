import { prisma } from "@/libs/prisma";

import { DomainError } from "@/common/utils/action-result";

import { CartItemWithProduct } from "@/types/cart.types";

export * from "@/types/cart.types";

export const MAX_CART_ITEM_QUANTITY = 99;

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getCart(userId: string): Promise<CartItemWithProduct[]> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      items: {
        // Hide rows that can no longer be bought: removed products and variants deleted by an admin.
        where: {
          product: { deletedAt: null, status: "PUBLISHED" },
          OR: [{ variantId: { not: null } }, { product: { variants: { none: {} } } }],
        },
        select: {
          id: true,
          quantity: true,
          productId: true,
          variantId: true,
          product: {
            select: {
              id: true,
              nameUk: true,
              nameEn: true,
              slug: true,
              price: true,
              discountPrice: true,
              images: {
                where: { isPrimary: true },
                select: { url: true, altText: true },
                take: 1,
              },
            },
          },
          variant: {
            select: {
              id: true,
              size: true,
              colorUk: true,
              colorEn: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) return [];

  return cart.items;
}

export async function addToCart(
  userId: string,
  productId: string,
  variantId?: string | null,
  quantity = 1,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, status: "PUBLISHED" },
    select: { nameUk: true, nameEn: true, variants: { select: { id: true, stock: true } } },
  });

  if (!product) throw new DomainError("productNotFound");

  const variant = product.variants.find((v) => v.id === variantId) ?? null;

  if (product.variants.length > 0 && !variant) {
    throw new DomainError("sizeRequired", { nameUk: product.nameUk, nameEn: product.nameEn });
  }

  const cart = await getOrCreateCart(userId);

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variant?.id ?? null },
  });

  const newQuantity = (existing?.quantity ?? 0) + quantity;

  if (newQuantity > MAX_CART_ITEM_QUANTITY) throw new DomainError("quantityLimit");
  if (variant && newQuantity > variant.stock) {
    throw new DomainError("stockLimit", { stock: variant.stock });
  }

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      variantId: variant?.id ?? null,
      quantity,
    },
  });
}

export async function updateCartItemQuantity(userId: string, cartItemId: string, quantity: number) {
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true, variant: { select: { stock: true } } },
  });

  if (!item || item.cart.userId !== userId) {
    throw new Error("Unauthorized to update this cart item");
  }

  if (quantity <= 0) {
    return prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  // Lowering the quantity stays allowed even if the stock has since dropped below it.
  if (item.variant && quantity > item.quantity && quantity > item.variant.stock) {
    throw new DomainError("stockLimit", { stock: item.variant.stock });
  }

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new Error("Unauthorized to remove this cart item");
  }

  return prisma.cartItem.delete({ where: { id: cartItemId } });
}

export async function clearCart(userId: string) {
  return prisma.cartItem.deleteMany({
    where: { cart: { userId } },
  });
}
