"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import { FormProvider, type Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { createProduct, updateProduct } from "@/actions/product.actions";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { ImagesSection, type ImagesSectionHandle } from "./ImagesSection";
import { VariantsSection } from "./VariantsSection";
import { BasicInfoSection } from "./sections/BasicInfoSection/BasicInfoSection";
import { DetailsSection } from "./sections/DetailsSection/DetailsSection";
import { PriceCategorySection } from "./sections/PriceCategorySection/PriceCategorySection";
import { SeoSection } from "./sections/SeoSection/SeoSection";

import { unwrapActionResult } from "@/common/utils/action-result";
import { MAX_IMAGES, type ProductFormData } from "@/common/validation/product/product.schema";
import { useProductSchema } from "@/common/validation/product/product.schema.client";

import styles from "./ProductForm.module.css";

type Category = { id: string; nameUk: string; nameEn: string; parentId: string | null };

interface ProductFormProps {
  categories: Category[];
  initialData?: ProductFormData;
  productId?: string;
}

export const ProductForm = ({ categories, initialData, productId }: ProductFormProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Admin.products.form");
  const imagesSectionRef = useRef<ImagesSectionHandle>(null);

  const schema = useProductSchema();

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(schema) as Resolver<ProductFormData>,
    defaultValues: initialData
      ? {
          nameUk: initialData.nameUk || "",
          nameEn: initialData.nameEn || "",
          slug: initialData.slug || "",
          descriptionUk: initialData.descriptionUk || "",
          descriptionEn: initialData.descriptionEn || "",
          compositionUk: initialData.compositionUk || "",
          compositionEn: initialData.compositionEn || "",
          careInstructionsUk: initialData.careInstructionsUk || "",
          careInstructionsEn: initialData.careInstructionsEn || "",
          measurementsUk: initialData.measurementsUk || "",
          measurementsEn: initialData.measurementsEn || "",
          price: initialData.price,
          discountPrice: initialData.discountPrice,
          status: initialData.status || "DRAFT",
          categoryId: initialData.categoryId || "",
          seoTitleUk: initialData.seoTitleUk || "",
          seoTitleEn: initialData.seoTitleEn || "",
          seoDescriptionUk: initialData.seoDescriptionUk || "",
          seoDescriptionEn: initialData.seoDescriptionEn || "",
          isFeatured: !!initialData.isFeatured,
          images: initialData.images || [],
          variants: initialData.variants || [],
        }
      : {
          nameUk: "",
          nameEn: "",
          slug: "",
          descriptionUk: "",
          descriptionEn: "",
          compositionUk: "",
          compositionEn: "",
          careInstructionsUk: "",
          careInstructionsEn: "",
          measurementsUk: "",
          measurementsEn: "",
          status: "DRAFT",
          categoryId: "",
          seoTitleUk: "",
          seoTitleEn: "",
          seoDescriptionUk: "",
          seoDescriptionEn: "",
          isFeatured: false,
          images: [],
          variants: [],
        },
  });

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { isSubmitting },
  } = methods;

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
    move: moveImage,
  } = useFieldArray({ control, name: "images" });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  const submitData = useCallback(
    async (data: ProductFormData) => {
      if (data.images) {
        data.images = data.images.map((img, idx) => ({
          ...img,
          isPrimary: idx === 0,
          order: idx,
        }));
      }
      if (productId) {
        unwrapActionResult(await updateProduct(productId, data, locale), t("messages.error"));
        toast.success(t("messages.updateSuccess"));
      } else {
        unwrapActionResult(await createProduct(data, locale), t("messages.error"));
        toast.success(t("messages.success"));
      }
      router.push("/admin/products");
    },
    [productId, locale, t, router],
  );

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const isValid = await trigger();
      if (!isValid) return;

      try {
        await imagesSectionRef.current?.uploadPendingFiles();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("messages.error"));
        return;
      }

      await handleSubmit(async (data) => {
        try {
          await submitData(data);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t("messages.error"));
        }
      })(e);
    },
    [handleSubmit, submitData, trigger, t],
  );

  const handleNameUkChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValue("nameUk", value);
    },
    [setValue],
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleFormSubmit} className={styles.form}>
        <BasicInfoSection onNameChange={handleNameUkChange} />

        <PriceCategorySection categories={categories} />

        <DetailsSection />

        <ImagesSection
          ref={imagesSectionRef}
          imageFields={imageFields}
          appendImage={appendImage}
          removeImage={removeImage}
          moveImage={moveImage}
          maxImages={MAX_IMAGES}
        />

        <VariantsSection
          variantFields={variantFields}
          appendVariant={appendVariant}
          removeVariant={removeVariant}
        />

        <SeoSection />

        <div className={styles.submitRow}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            {t("buttons.cancel")}
          </button>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? t("buttons.saving") : t("buttons.save")}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};
