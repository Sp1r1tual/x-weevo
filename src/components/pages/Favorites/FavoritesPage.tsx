"use client";

import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import { toggleFavoriteAction } from "@/actions/favorites.actions";
import type { FavoriteProduct } from "@/db/favorites";
import { Link } from "@/i18n/navigation";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/ProductCardSkeleton/ProductCardSkeleton";

import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useModalStore } from "@/store/useModalStore";

import styles from "./FavoritesPage.module.css";

interface FavoritesPageProps {
  initialFavorites: FavoriteProduct[];
  locale: string;
}

export const FavoritesPage = ({ initialFavorites, locale }: FavoritesPageProps) => {
  const t = useTranslations("Favorites");
  const tErr = useTranslations("Errors");
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useModalStore((s) => s.openAuthModal);

  const favoriteIds = useFavoritesStore((s) => s.ids);
  const { toggle } = useFavoritesStore();

  const visibleFavorites = initialFavorites.filter((fav) => favoriteIds.includes(fav.product.id));

  const handleRemove = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggle(productId);
    try {
      await toggleFavoriteAction(productId);
    } catch {
      toggle(productId);
      toast.error(tErr("removeFavorite"));
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
        </div>
        <div className={styles.grid}>
          <ProductCardSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
        </div>
        <EmptyState
          title={t("loginRequired")}
          icon={Heart}
          action={
            <Button onClick={openAuthModal} size="lg" icon={<Heart size={18} />}>
              {t("loginButton")}
            </Button>
          }
        />
      </div>
    );
  }

  if (visibleFavorites.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
        </div>
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          icon={Heart}
          action={
            <Link href="/new-arrivals">
              <Button size="lg">{t("goCatalog")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("itemsCount", { count: visibleFavorites.length })}</p>
      </div>

      <div className={styles.grid}>
        {visibleFavorites.map(({ product }, index) => (
          <div key={product.id} className={styles.cardWrapper}>
            <ProductCard
              product={product}
              locale={locale}
              priority={index < 4}
              hideFavoriteButton={true}
            />
            <button
              className={styles.removeBtn}
              onClick={(e) => handleRemove(product.id, e)}
              aria-label={t("remove")}
            >
              <Heart size={20} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
