"use server";

import {
  MAX_CART_ITEM_QUANTITY,
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/db/cart";
import { z } from "zod";

import { actionRateLimit } from "@/common/auth/rate-limit";
import { assertAuth } from "@/common/auth/server";
import { runAction } from "@/common/utils/action-result.server";
import { revalidateLocalizedPath } from "@/common/utils/revalidate";

const addToCartSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullish(),
  quantity: z.number().int().min(1).max(MAX_CART_ITEM_QUANTITY),
});

const updateCartItemSchema = z.object({
  cartItemId: z.uuid(),
  quantity: z.number().int().min(0).max(MAX_CART_ITEM_QUANTITY),
});

export async function getCartAction() {
  const user = await assertAuth();
  return getCart(user.id);
}

export async function addToCartAction(productId: string, variantId?: string | null, quantity = 1) {
  return runAction(async () => {
    const user = await assertAuth();

    await actionRateLimit.check(100, `addToCart:${user.id}`);

    const input = addToCartSchema.parse({ productId, variantId, quantity });

    const result = await addToCart(user.id, input.productId, input.variantId, input.quantity);
    revalidateLocalizedPath("/cart");
    return result;
  });
}

export async function updateCartItemAction(cartItemId: string, quantity: number) {
  return runAction(async () => {
    const user = await assertAuth();

    await actionRateLimit.check(100, `updateCartItem:${user.id}`);

    const input = updateCartItemSchema.parse({ cartItemId, quantity });

    return updateCartItemQuantity(user.id, input.cartItemId, input.quantity);
  });
}

export async function removeCartItemAction(cartItemId: string) {
  const user = await assertAuth();

  await actionRateLimit.check(100, `removeCartItem:${user.id}`);

  if (!z.uuid().safeParse(cartItemId).success) {
    throw new Error("Invalid cart item ID");
  }

  await removeCartItem(user.id, cartItemId);
}

export async function clearCartAction() {
  const user = await assertAuth();

  await actionRateLimit.check(20, `clearCart:${user.id}`);

  await clearCart(user.id);
  revalidateLocalizedPath("/cart");
}
