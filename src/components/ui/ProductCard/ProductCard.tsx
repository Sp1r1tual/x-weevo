"use client";

import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import { toggleFavoriteAction } from "@/actions/favorites.actions";
import { Link } from "@/i18n/navigation";
import { Heart, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge/Badge";
import { PriceDisplay } from "@/components/ui/PriceDisplay/PriceDisplay";
import { SkeletonImage } from "@/components/ui/SkeletonImage/SkeletonImage";

import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useModalStore } from "@/store/useModalStore";

import { getLocalizedField } from "@/common/utils/locale";
import { calculateDiscountPercentage } from "@/common/utils/product";

import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    nameUk: string;
    nameEn: string;
    price: number;
    discountPrice: number | null;
    isFeatured: boolean;
    images: { url: string; altText: string | null }[];
    variants: { size: string; stock: number }[];
    category: { slug: string; nameUk?: string; nameEn?: string };
  };
  locale: string;
  priority?: boolean;
  hideFavoriteButton?: boolean;
}

export const ProductCard = ({
  product,
  locale,
  priority = false,
  hideFavoriteButton = false,
}: ProductCardProps) => {
  const name = getLocalizedField(product, "name", locale);
  const primaryImage = product.images[0]?.url || "/placeholder.webp";
  const isOutOfStock = product.variants.every((v) => v.stock === 0);

  const tErr = useTranslations("Errors");
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useModalStore((s) => s.openAuthModal);
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const { toggle } = useFavoritesStore();

  const favorited = favoriteIds.includes(product.id);

  const discountPercentage = calculateDiscountPercentage(product.price, product.discountPrice);
  const availableSizes = product.variants.filter((v) => v.stock > 0).map((v) => v.size);

  const categoryName = getLocalizedField(product.category, "name", locale, "slug");

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal();
      return;
    }

    toggle(product.id);
    try {
      await toggleFavoriteAction(product.id);
    } catch {
      toggle(product.id);
      toast.error(tErr("updateFavorites"));
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/${locale}/product/${product.slug}`;
    if (navigator.share) {
      navigator.share({ title: name, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <Link href={`/product/${product.slug}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <div className={styles.badges}>
          {isOutOfStock && (
            <Badge
              variant="outOfStock"
              label={locale === "en" ? "Out of Stock" : "Немає в наявності"}
            />
          )}
          {!isOutOfStock && discountPercentage > 0 && (
            <Badge variant="sale" label={`-${discountPercentage}%`} />
          )}
          {!isOutOfStock && product.isFeatured && discountPercentage === 0 && (
            <Badge variant="featured" label={locale === "en" ? "Featured" : "Топ"} />
          )}
        </div>

        <div className={`${styles.quickActions} ${hideFavoriteButton ? styles.shifted : ""}`}>
          {!hideFavoriteButton && (
            <button
              className={`${styles.actionBtn} ${favorited ? styles.favorited : ""}`}
              onClick={handleFavorite}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={15} fill={favorited ? "currentColor" : "none"} />
            </button>
          )}
          <button className={styles.actionBtn} onClick={handleShare} aria-label="Share product">
            <Share2 size={15} />
          </button>
        </div>

        <div className={styles.imageWrapper}>
          <SkeletonImage
            src={primaryImage}
            alt={product.images[0]?.altText || name}
            fill
            preload={priority}
            className={styles.image}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>

        {!isOutOfStock && availableSizes.length > 0 && (
          <div className={styles.sizesOverlay}>
            {availableSizes.slice(0, 5).map((size) => (
              <span key={size} className={styles.sizeIndicator}>
                {size}
              </span>
            ))}
            {availableSizes.length > 5 && <span className={styles.sizeIndicator}>+</span>}
          </div>
        )}
      </div>

      <div className={styles.info}>
        {categoryName && <p className={styles.categoryLabel}>{categoryName}</p>}
        <h3 className={styles.name} title={name}>
          {name}
        </h3>
        <PriceDisplay price={product.price} discountPrice={product.discountPrice} size="sm" />
      </div>
    </Link>
  );
};
