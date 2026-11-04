"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";

import { createCategory, updateCategory } from "@/actions/category.actions";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { AdminInput } from "@/components/ui/admin/AdminInput/AdminInput";
import { AdminSelect } from "@/components/ui/admin/AdminSelect/AdminSelect";
import { AdminTextarea } from "@/components/ui/admin/AdminTextarea/AdminTextarea";

import { unwrapActionResult } from "@/common/utils/action-result";
import {
  type CategoryFormData,
  createCategorySchema,
} from "@/common/validation/category/category.schema";

import styles from "./CategoryForm.module.css";

type ParentCategory = {
  id: string;
  nameUk: string;
  nameEn: string;
  parentId: string | null;
  order: number;
};

interface CategoryFormProps {
  categories: ParentCategory[];

  editId?: string;
  defaultValues?: Partial<CategoryFormData>;
}

export const CategoryForm = ({ categories, editId, defaultValues }: CategoryFormProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Admin.categories.form");

  const schema = useMemo(
    () =>
      createCategorySchema({
        nameRequired: t("validation.nameRequired"),
        nameMax: t("validation.nameMax"),
        slugRequired: t("validation.slugRequired"),
        slugRegex: t("validation.slugRegex"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(schema) as Resolver<CategoryFormData>,
    defaultValues: {
      nameUk: "",
      nameEn: "",
      slug: "",
      parentId: null,
      order: 0,
      seoTitleUk: "",
      seoTitleEn: "",
      seoDescriptionUk: "",
      seoDescriptionEn: "",
      ...defaultValues,
    },
  });

  const [createForBoth, setCreateForBoth] = useState(false);

  const watchedParentId = useWatch({ control, name: "parentId" });
  useEffect(() => {
    if (editId) return;
    const siblings = categories.filter((c) => {
      if (!watchedParentId) return c.parentId === null;
      return c.parentId === watchedParentId;
    });
    const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((c) => c.order)) + 1 : 0;
    setValue("order", nextOrder);
  }, [watchedParentId, categories, editId, setValue]);

  const menCategory = categories.find(
    (c) => c.parentId === null && c.nameEn.toLowerCase() === "men",
  );
  const womenCategory = categories.find(
    (c) => c.parentId === null && c.nameEn.toLowerCase() === "women",
  );

  const canCreateForBoth = !editId && !!menCategory && !!womenCategory;

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editId) {
        unwrapActionResult(await updateCategory(editId, data, locale), t("messages.error"));
        toast.success(t("messages.updateSuccess"));
      } else if (createForBoth && canCreateForBoth) {
        const results = await Promise.all([
          createCategory({ ...data, parentId: menCategory!.id, slug: `${data.slug}-men` }, locale),
          createCategory(
            { ...data, parentId: womenCategory!.id, slug: `${data.slug}-women` },
            locale,
          ),
        ]);
        results.forEach((result) => unwrapActionResult(result, t("messages.error")));
        toast.success(t("messages.createSuccess"));
      } else {
        unwrapActionResult(await createCategory(data, locale), t("messages.error"));
        toast.success(t("messages.createSuccess"));
      }
      router.push("/admin/categories");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("messages.error"));
    }
  };

  const handleNameUkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("nameUk", value);
  };

  const parentOptions = categories.filter((c) => c.id !== editId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("sections.basic")}</h2>
        <div className={styles.grid2}>
          <AdminInput
            id="cat-name-uk"
            label={`${t("labels.name")} (Укр)`}
            placeholder={t("placeholders.name")}
            error={errors.nameUk?.message}
            {...register("nameUk")}
            onChange={handleNameUkChange}
          />
          <AdminInput
            id="cat-name-en"
            label={`${t("labels.name")} (Eng)`}
            placeholder={t("placeholders.name")}
            error={errors.nameEn?.message}
            {...register("nameEn")}
          />
          <AdminInput
            id="cat-slug"
            label={t("labels.slug")}
            placeholder={t("placeholders.slug")}
            error={errors.slug?.message}
            {...register("slug")}
          />
        </div>

        <div className={styles.grid2}>
          <AdminSelect
            id="cat-parent"
            label={t("labels.parent")}
            error={errors.parentId?.message}
            {...register("parentId")}
          >
            <option value="">{t("placeholders.noParent")}</option>
            {(() => {
              type CategoryNode = ParentCategory & { children: CategoryNode[] };

              const categoryMap = new Map<string, CategoryNode>();
              parentOptions.forEach((cat) => {
                categoryMap.set(cat.id, { ...cat, children: [] });
              });

              const roots: CategoryNode[] = [];
              categoryMap.forEach((node) => {
                if (node.parentId && categoryMap.has(node.parentId)) {
                  categoryMap.get(node.parentId)!.children.push(node);
                } else {
                  roots.push(node);
                }
              });

              const sortNodes = (nodes: CategoryNode[]) => {
                nodes.sort((a, b) => {
                  if (a.order !== b.order) return a.order - b.order;
                  const nameA = locale === "uk" ? a.nameUk : a.nameEn;
                  const nameB = locale === "uk" ? b.nameUk : b.nameEn;
                  return nameA.localeCompare(nameB);
                });
                nodes.forEach((node) => sortNodes(node.children));
              };
              sortNodes(roots);

              const renderOptions = (nodes: CategoryNode[], depth = 0): React.ReactNode[] => {
                return nodes.flatMap((node) => {
                  const indent = "\u00A0\u00A0".repeat(depth);
                  const prefix = depth > 0 ? "↳ " : "";
                  const label = locale === "uk" ? node.nameUk : node.nameEn;

                  const currentOption = (
                    <option key={node.id} value={node.id}>
                      {indent}
                      {prefix}
                      {label}
                    </option>
                  );

                  if (node.children.length > 0) {
                    return [currentOption, ...renderOptions(node.children, depth + 1)];
                  }

                  return [currentOption];
                });
              };

              return renderOptions(roots);
            })()}
          </AdminSelect>

          <Controller
            name="order"
            control={control}
            render={({ field }) => (
              <AdminInput
                id="cat-order"
                label={t("labels.order")}
                type="number"
                min={0}
                placeholder="0"
                error={errors.order?.message}
                value={field.value ?? 0}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("sections.seo")}</h2>
        <div className={styles.grid2}>
          <AdminInput
            id="cat-seo-title-uk"
            label={`${t("labels.seoTitle")} (Укр)`}
            placeholder={t("placeholders.seoTitle")}
            error={errors.seoTitleUk?.message}
            {...register("seoTitleUk")}
          />
          <AdminInput
            id="cat-seo-title-en"
            label={`${t("labels.seoTitle")} (Eng)`}
            placeholder={t("placeholders.seoTitle")}
            error={errors.seoTitleEn?.message}
            {...register("seoTitleEn")}
          />
          <AdminTextarea
            id="cat-seo-description-uk"
            label={`${t("labels.seoDescription")} (Укр)`}
            placeholder={t("placeholders.seoDescription")}
            rows={3}
            error={errors.seoDescriptionUk?.message}
            {...register("seoDescriptionUk")}
          />
          <AdminTextarea
            id="cat-seo-description-en"
            label={`${t("labels.seoDescription")} (Eng)`}
            placeholder={t("placeholders.seoDescription")}
            rows={3}
            error={errors.seoDescriptionEn?.message}
            {...register("seoDescriptionEn")}
          />
        </div>
      </section>

      {canCreateForBoth && (
        <div className={styles.checkboxRow}>
          <label className={styles.checkboxLabel}>
            <input
              id="cat-create-for-both"
              type="checkbox"
              className={styles.checkbox}
              checked={createForBoth}
              onChange={(e) => setCreateForBoth(e.target.checked)}
            />
            <span>
              {t.rich("labels.createForBoth", {
                code: (chunks) => <code>{chunks}</code>,
              })}
            </span>
          </label>
        </div>
      )}

      <div className={styles.submitRow}>
        <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
          {t("buttons.cancel")}
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? t("buttons.saving") : t("buttons.save")}
        </button>
      </div>
    </form>
  );
};
