"use server";

import { getDefaultAddress, upsertDefaultAddress } from "@/db/address";
import type { ShippingCarrier } from "@prisma/client";

import { actionRateLimit } from "@/common/auth/rate-limit";
import { assertAuth } from "@/common/auth/server";
import { ActionError } from "@/common/utils/action-result";
import { runAction } from "@/common/utils/action-result.server";
import {
  type AddressFormData,
  addressSchema,
} from "@/common/validation/profile/schemas/address.schema";

export async function getAddressAction() {
  const user = await assertAuth();
  return getDefaultAddress(user.id);
}

export async function saveAddressAction(data: AddressFormData) {
  return runAction(async () => {
    const user = await assertAuth();

    await actionRateLimit.check(20, `saveAddress:${user.id}`);

    const result = addressSchema.safeParse(data);
    if (!result.success) {
      throw new ActionError(result.error.issues[0].message);
    }

    const { carrier, city, warehouse } = result.data;

    return upsertDefaultAddress(user.id, {
      carrier: carrier as ShippingCarrier,
      city,
      warehouse,
      street: null,
    });
  });
}
