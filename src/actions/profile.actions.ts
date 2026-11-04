"use server";

import { deleteDefaultAddress, upsertDefaultAddress } from "@/db/address";
import { updateProfile } from "@/db/profile";
import { type ShippingCarrier } from "@prisma/client";

import { actionRateLimit } from "@/common/auth/rate-limit";
import { assertAuth } from "@/common/auth/server";
import { ActionError } from "@/common/utils/action-result";
import { runAction } from "@/common/utils/action-result.server";
import { type ProfileFormData } from "@/common/validation/profile/schemas/profile.schema";
import { getProfileSchema } from "@/common/validation/profile/schemas/profile.schema.server";

export async function updateProfileAction(data: ProfileFormData, locale: string) {
  return runAction(async () => {
    const user = await assertAuth();
    await actionRateLimit.check(20, `updateProfile:${user.id}`);
    const schema = await getProfileSchema(locale);
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new ActionError(result.error.issues[0].message);
    }

    const { name, phone, carrier, city, warehouse } = result.data;

    const updatedProfile = await updateProfile(user.id, {
      name,
      phone: phone || null,
    });

    if (carrier && city && warehouse) {
      await upsertDefaultAddress(user.id, {
        carrier: carrier as ShippingCarrier,
        city,
        warehouse,
        street: null,
      });
    } else {
      await deleteDefaultAddress(user.id);
    }

    return updatedProfile;
  });
}
