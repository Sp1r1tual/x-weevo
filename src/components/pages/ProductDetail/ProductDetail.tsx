import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/Badge/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { PriceDisplay } from "@/components/ui/PriceDisplay/PriceDisplay";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";

import { ImageGallery } from "./_components/ImageGallery/ImageGallery";
import { ProductActions } from "./_components/ProductActions/ProductActions";

import { getLocalizedField } from "@/common/utils/locale";
import { calculateDiscountPercentage } from "@/common/utils/product";

import styles from "./ProductDetail.module.css";

interface ProductDetailProps {
  product: {
    id: string;
    slug: string;
    nameUk: string;
    nameEn: string;
    descriptionUk: string | null;
    descriptionEn: string | null;
    compositionUk: string | null;
    compositionEn: string | null;
    careInstructionsUk: string | null;
    careInstructionsEn: string | null;
    measurementsUk: string | null;
    measurementsEn: string | null;
    price: number;
    discountPrice: number | null;
    isFeatured: boolean;
    images: { url: string; altText: string | null }[];
    variants: {
      id: string;
      size: string;
      stock: number;
      colorUk: string | null;
      colorEn: string | null;
    }[];
    category: {
      slug: string;
      nameUk: string;
      nameEn: string;
      parent: { slug: string; nameUk: string; nameEn: string } | null;
    } | null;
    relatedProducts: {
      id: string;
      slug: string;
      nameUk: string;
      nameEn: string;
      price: number;
      discountPrice: number | null;
      isFeatured: boolean;
      images: { url: string; altText: string | null }[];
      variants: { size: string; stock: number }[];
      category: { slug: string };
    }[];
  };
  locale: string;
}

export const ProductDetail = async ({ product, locale }: ProductDetailProps) => {
  const t = await getTranslations({ locale, namespace: "ProductDetail" });

  const name = getLocalizedField(product, "name", locale);
  const description = getLocalizedField(product, "description", locale);
  const composition = getLocalizedField(product, "composition", locale);
  const care = getLocalizedField(product, "careInstructions", locale);
  const measurements = getLocalizedField(product, "measurements", locale);

  const isOutOfStock = product.variants.every((v) => v.stock === 0);

  const discountPercentage = calculateDiscountPercentage(product.price, product.discountPrice);

  const breadcrumbs: { label: string; href?: string }[] = [{ label: t("home"), href: "/" }];

  if (product.category) {
    if (product.category.parent) {
      breadcrumbs.push({
        label: getLocalizedField(product.category.parent, "name", locale),
        href: `/${product.category.parent.slug}`,
      });
    }
    breadcrumbs.push({
      label: getLocalizedField(product.category, "name", locale),
      href: `/${product.category.parent?.slug || product.category.slug}?subcategory=${product.category.slug}`,
    });
  }

  breadcrumbs.push({ label: name });

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Breadcrumbs items={breadcrumbs} className={styles.breadcrumbs} />

        <div className={styles.mainContent}>
          <div className={styles.gallerySection}>
            <ImageGallery images={product.images} />
          </div>

          <div className={styles.infoSection}>
            <div className={styles.header}>
              <h1 className={styles.title}>{name}</h1>
              <div className={styles.priceRow}>
                <PriceDisplay
                  price={product.price}
                  discountPrice={product.discountPrice}
                  size="lg"
                />
                {!isOutOfStock && discountPercentage > 0 && (
                  <Badge variant="sale" label={`-${discountPercentage}%`} />
                )}
                {isOutOfStock && <Badge variant="outOfStock" label={t("out-of-stock")} />}
              </div>
            </div>

            <div className={styles.optionsSection}>
              <ProductActions product={product} />
            </div>

            <div className={styles.detailsSection}>
              {description && (
                <div className={styles.detailBlock}>
                  <h3 className={styles.detailTitle}>{t("details")}</h3>
                  <p className={styles.detailContent}>{description}</p>
                </div>
              )}

              {composition && (
                <div className={styles.detailBlock}>
                  <h3 className={styles.detailTitle}>{t("composition")}</h3>
                  <p className={styles.detailContent}>{composition}</p>
                </div>
              )}

              {care && (
                <div className={styles.detailBlock}>
                  <h3 className={styles.detailTitle}>{t("care")}</h3>
                  <p className={styles.detailContent}>{care}</p>
                </div>
              )}

              {measurements && (
                <div className={styles.detailBlock}>
                  <h3 className={styles.detailTitle}>{t("measurements")}</h3>
                  <p className={styles.detailContent}>{measurements}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>{t("related")}</h2>
            <div className={styles.relatedGrid}>
              {product.relatedProducts.map((related, index) => (
                <ProductCard
                  key={related.id}
                  product={related}
                  locale={locale}
                  priority={index < 4}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
