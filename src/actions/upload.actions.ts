"use server";

import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { getClientIp, limiter } from "@/common/auth/rate-limit";
import { assertAdmin } from "@/common/auth/server";
import { ActionError } from "@/common/utils/action-result";
import { runAction } from "@/common/utils/action-result.server";
import { getSupabaseStorageClient } from "@/common/utils/supabase/client";
import { validateImageFile } from "@/common/validation/file.validation";

export async function uploadProductImage(formData: FormData) {
  return runAction(async () => {
    const user = await assertAdmin();

    const t = await getTranslations("Admin.products.form.validation");

    const ip = getClientIp(await headers());
    try {
      await limiter.check(50, `upload_${user.id}_${ip}`);
    } catch {
      throw new ActionError(t("imageUploadFailed"));
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ActionError(t("imageTypeInvalid"));
    }

    await validateImageFile(file, {
      imageSizeMax: t("imageSizeMax"),
      imageTypeInvalid: t("imageTypeInvalid"),
    });

    const supabase = getSupabaseStorageClient();
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, file, { upsert: false, contentType: file.type });

    if (error) {
      console.error("Failed to upload image:", error.message);
      throw new ActionError(t("imageUploadFailed"));
    }

    const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  });
}
