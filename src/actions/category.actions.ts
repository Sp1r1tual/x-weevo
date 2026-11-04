"use server";

import { getTranslations } from "next-intl/server";

import {
  deleteCategory as deleteCategoryDb,
  findAllDescendantCategoryIds,
  insertCategory,
  updateCategory as updateCategoryDb,
} from "@/db/category";
import { z } from "zod";

import { assertAdmin } from "@/common/auth/server";
import { ActionError } from "@/common/utils/action-result";
import { runAction } from "@/common/utils/action-result.server";
import { isUniqueConstraintError } from "@/common/utils/prisma-errors";
import { revalidateLocalizedPath, revalidateStorefront } from "@/common/utils/revalidate";
import { type CategoryFormData } from "@/common/validation/category/category.schema";
import { getCategorySchema } from "@/common/validation/category/category.schema.server";

async function parseCategory(data: CategoryFormData, locale: string) {
  const schema = await getCategorySchema(locale);
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ActionError(result.error.issues[0].message);
  }

  return result.data;
}

async function saveCategory<T>(locale: string, save: () => Promise<T>) {
  try {
    return await save();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const t = await getTranslations({ locale, namespace: "Admin.categories.form.validation" });
      throw new ActionError(t("slugTaken"));
    }
    throw error;
  }
}

export async function createCategory(data: CategoryFormData, locale: string) {
  return runAction(async () => {
    await assertAdmin();

    const parsed = await parseCategory(data, locale);
    const category = await saveCategory(locale, () => insertCategory(parsed));

    revalidateLocalizedPath("/admin/categories");
    revalidateStorefront();
    return category;
  });
}

export async function updateCategory(id: string, data: CategoryFormData, locale: string) {
  return runAction(async () => {
    await assertAdmin();

    if (!z.uuid().safeParse(id).success) {
      throw new Error("Invalid category ID");
    }

    const parsed = await parseCategory(data, locale);

    if (parsed.parentId) {
      const descendantIds = await findAllDescendantCategoryIds(id);

      if (parsed.parentId === id || descendantIds.includes(parsed.parentId)) {
        const t = await getTranslations({ locale, namespace: "Admin.categories.form.validation" });
        throw new ActionError(t("parentInvalid"));
      }
    }

    const category = await saveCategory(locale, () => updateCategoryDb(id, parsed));

    revalidateLocalizedPath("/admin/categories");
    revalidateStorefront();
    return category;
  });
}

export async function deleteCategory(id: string) {
  await assertAdmin();

  if (!z.uuid().safeParse(id).success) {
    throw new Error("Invalid category ID");
  }

  try {
    await deleteCategoryDb(id);
    revalidateLocalizedPath("/admin/categories");
    revalidateStorefront();
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw new Error("Failed to delete category due to an internal error");
  }
}
