import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { createProductSchema } from "./product.schema";

export function useProductSchema() {
  const t = useTranslations("Admin.products.form");

  return useMemo(
    () =>
      createProductSchema({
        imageUrlRequired: t("validation.imageUrlRequired"),
        imagesTooMany: t("validation.imagesTooMany"),
        imageDuplicateUrl: t("validation.imageDuplicateUrl"),
        imageAltMax: t("validation.imageAltMax"),
        variantSizeRequired: t("validation.variantSizeRequired"),
        variantStockInvalid: t("validation.variantStockInvalid"),
        productNameRequired: t("validation.productNameRequired"),
        productNameMax: t("validation.productNameMax"),
        productSlugRequired: t("validation.productSlugRequired"),
        productSlugRegex: t("validation.productSlugRegex"),
        productPriceRequired: t("validation.productPriceRequired"),
        productPricePositive: t("validation.productPricePositive"),
        productDiscountPricePositive: t("validation.productDiscountPricePositive"),
        productDiscountPriceTooHigh: t("validation.productDiscountPriceTooHigh"),
        productCategoryRequired: t("validation.productCategoryRequired"),
      }),
    [t],
  );
}
