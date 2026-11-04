"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "react-toastify";

import { addToCartAction } from "@/actions/cart.actions";
import { toggleFavoriteAction } from "@/actions/favorites.actions";
import { Heart, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/Button/Button";

import { ColorSelector } from "../ColorSelector/ColorSelector";
import { SizeSelector } from "../SizeSelector/SizeSelector";

import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useModalStore } from "@/store/useModalStore";

import { unwrapActionResult } from "@/common/utils/action-result";
import { getLocalizedField } from "@/common/utils/locale";
import { isVariantInStock } from "@/common/utils/product";

import styles from "./ProductActions.module.css";

interface ProductVariant {
  id: string;
  size: string;
  stock: number;
  colorUk: string | null;
  colorEn: string | null;
}

interface ProductActionsProps {
  product: {
    id: string;
    slug: string;
    nameUk: string;
    nameEn: string;
    price: number;
    discountPrice: number | null;
    images: { url: string; altText: string | null }[];
    variants: ProductVariant[];
  };
}

const getColorKey = (variant: ProductVariant) => variant.colorUk ?? "";

export const ProductActions = ({ product }: ProductActionsProps) => {
  const t = useTranslations("ProductDetail");
  const tErr = useTranslations("Errors");
  const locale = useLocale();

  const firstAvailableVariant = product.variants.find(isVariantInStock);
  // A sold-out product still shows its colors and sizes, all unavailable.
  const initialVariant = firstAvailableVariant ?? product.variants[0];
  const [selectedColor, setSelectedColor] = useState(
    initialVariant ? getColorKey(initialVariant) : "",
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    firstAvailableVariant?.size ?? null,
  );
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const openAuthModal = useModalStore((s) => s.openAuthModal);
  const user = useAuthStore((s) => s.user);
  const { addItem, updateItemId, setCart } = useCartStore();
  const { ids: favoriteIds, toggle: toggleFavoriteStore } = useFavoritesStore();
  const isFavorited = favoriteIds.includes(product.id);

  const isOutOfStock = !firstAvailableVariant;

  const colorVariants = product.variants.filter((v) => getColorKey(v) === selectedColor);
  const colorKeys = [...new Set(product.variants.map(getColorKey))];
  const hasColors = colorKeys.some(Boolean);

  const colorOptions = colorKeys.map((key) => {
    const variants = product.variants.filter((v) => getColorKey(v) === key);
    return {
      key,
      label: getLocalizedField(variants[0], "color", locale) || key,
      isAvailable: variants.some(isVariantInStock),
    };
  });

  const handleSelectColor = (key: string) => {
    setSelectedColor(key);

    const variants = product.variants.filter((v) => getColorKey(v) === key);
    const isSizeAvailable = variants.some((v) => v.size === selectedSize && isVariantInStock(v));

    if (!isSizeAvailable) {
      setSelectedSize(variants.find(isVariantInStock)?.size ?? null);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.warning(t("select-size"));
      return;
    }
    if (!user) {
      toast.info(t("login-required"));
      openAuthModal();
      return;
    }

    setIsAddingToCart(true);
    const variant = colorVariants.find((v) => v.size === selectedSize);
    const tempCartItemId = `temp-${Date.now()}`;
    // addItem may merge into an existing row, so a failure has to restore the whole cart.
    const previousItems = useCartStore.getState().items;

    addItem({
      id: tempCartItemId,
      productId: product.id,
      variantId: variant?.id || null,
      quantity: 1,
      product: {
        id: product.id,
        nameUk: product.nameUk,
        nameEn: product.nameEn,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        images: product.images,
      },
      variant: variant
        ? {
            id: variant.id,
            size: variant.size,
            colorUk: variant.colorUk,
            colorEn: variant.colorEn,
          }
        : null,
    });

    try {
      const dbItem = unwrapActionResult(
        await addToCartAction(product.id, variant?.id || null, 1),
        tErr("addToCart"),
      );
      updateItemId(tempCartItemId, dbItem.id);
      toast.success(t("added-to-cart"));
    } catch (error) {
      setCart(previousItems);
      toast.error(error instanceof Error ? error.message : tErr("addToCart"));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setIsTogglingFavorite(true);
    toggleFavoriteStore(product.id);

    try {
      const { isFavorited: nowFavorited } = await toggleFavoriteAction(product.id);
      if (nowFavorited) {
        toast.success(t("added-to-favorites"));
      } else {
        toast.info(t("removed-from-favorites"));
      }
    } catch {
      toggleFavoriteStore(product.id);
      toast.error(tErr("updateFavorites"));
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <>
      {hasColors && (
        <div className={styles.option}>
          <span className={styles.optionLabel}>{t("color")}</span>
          <ColorSelector
            label={t("color")}
            options={colorOptions}
            selectedKey={selectedColor}
            onSelect={handleSelectColor}
          />
        </div>
      )}

      <div className={styles.option}>
        <span className={styles.optionLabel}>{t("size")}</span>
        <SizeSelector
          variants={colorVariants}
          selectedSize={selectedSize}
          onSelect={setSelectedSize}
        />
      </div>

      <div className={styles.actions}>
        <Button
          fullWidth
          size="lg"
          disabled={isOutOfStock || isAddingToCart}
          icon={<ShoppingBag size={20} />}
          onClick={handleAddToCart}
        >
          {t("add-to-cart")}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          disabled={isTogglingFavorite}
          icon={
            <Heart
              size={20}
              fill={isFavorited ? "#ef4444" : "none"}
              color={isFavorited ? "#ef4444" : "currentColor"}
            />
          }
          onClick={handleToggleFavorite}
        >
          {isFavorited ? t("in-favorites") : t("add-to-favorites")}
        </Button>
      </div>
    </>
  );
};
