"use server";

import { getTranslations } from "next-intl/server";

import { insertProduct, softDeleteProduct, updateProductInDb } from "@/db/product";
import { z } from "zod";

import { assertAdmin } from "@/common/auth/server";
import { ActionError } from "@/common/utils/action-result";
import { runAction } from "@/common/utils/action-result.server";
import { isUniqueConstraintError } from "@/common/utils/prisma-errors";
import { revalidateLocalizedPath, revalidateStorefront } from "@/common/utils/revalidate";
import { type ProductFormData } from "@/common/validation/product/product.schema";
import { getProductSchema } from "@/common/validation/product/product.schema.server";

async function parseProduct(data: ProductFormData, locale: string) {
  const schema = await getProductSchema(locale);
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ActionError(result.error.issues[0].message);
  }

  return result.data;
}

async function saveProduct<T>(locale: string, save: () => Promise<T>) {
  try {
    return await save();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const t = await getTranslations({ locale, namespace: "Admin.products.form.validation" });
      throw new ActionError(t("productSlugTaken"));
    }
    throw error;
  }
}

export async function createProduct(data: ProductFormData, locale: string) {
  return runAction(async () => {
    await assertAdmin();

    const parsed = await parseProduct(data, locale);
    const product = await saveProduct(locale, () => insertProduct(parsed));

    revalidateLocalizedPath("/admin/products");
    revalidateStorefront();
    return product;
  });
}

export async function updateProduct(id: string, data: ProductFormData, locale: string) {
  return runAction(async () => {
    await assertAdmin();

    if (!z.uuid().safeParse(id).success) {
      throw new Error("Invalid product ID");
    }

    const parsed = await parseProduct(data, locale);
    const product = await saveProduct(locale, () => updateProductInDb(id, parsed));

    revalidateLocalizedPath("/admin/products");
    revalidateLocalizedPath(`/admin/products/${id}`);
    revalidateStorefront();
    return product;
  });
}

export async function deleteProduct(id: string) {
  await assertAdmin();

  if (!z.uuid().safeParse(id).success) {
    throw new Error("Invalid product ID");
  }

  try {
    await softDeleteProduct(id);
    revalidateLocalizedPath("/admin/products");
    revalidateStorefront();
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw new Error("Failed to delete product due to an internal error");
  }
}
