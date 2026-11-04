"use server";

import { updateOrderStatusAdmin } from "@/db/order";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

import { actionRateLimit } from "@/common/auth/rate-limit";
import { assertAdmin } from "@/common/auth/server";
import { runAction } from "@/common/utils/action-result.server";
import { revalidateLocalizedPath, revalidateProductPages } from "@/common/utils/revalidate";

const updateOrderStatusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(OrderStatus),
  trackingNumber: z.string().max(255).nullable().optional(),
});

export async function updateAdminOrderStatusAction(
  orderId: string,
  status: string,
  trackingNumber?: string | null,
) {
  return runAction(async () => {
    const admin = await assertAdmin();

    await actionRateLimit.check(120, `adminOrderAction:${admin.id}`);

    const input = updateOrderStatusSchema.parse({ orderId, status, trackingNumber });

    const result = await updateOrderStatusAdmin(input.orderId, input.status, input.trackingNumber);

    revalidateLocalizedPath(`/admin/orders/${orderId}`);
    revalidateLocalizedPath("/admin/orders");
    revalidateLocalizedPath(`/profile/orders/${orderId}`);
    revalidateLocalizedPath("/profile");
    revalidateProductPages(result.items.map((item) => item.product?.slug));

    return result;
  });
}
