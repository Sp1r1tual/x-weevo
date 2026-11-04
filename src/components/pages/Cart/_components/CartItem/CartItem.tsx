"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";

import { removeCartItemAction, updateCartItemAction } from "@/actions/cart.actions";
import { Link } from "@/i18n/navigation";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

import { PriceDisplay } from "@/components/ui/PriceDisplay/PriceDisplay";
import { SkeletonImage } from "@/components/ui/SkeletonImage/SkeletonImage";

import { useCartStore } from "@/store/useCartStore";
import type { CartItem as CartItemType } from "@/store/useCartStore";

import { unwrapActionResult } from "@/common/utils/action-result";
import { getLocalizedField } from "@/common/utils/locale";

import styles from "./CartItem.module.css";

interface CartItemProps {
  item: CartItemType;
  locale: string;
}

export const CartItem = ({ item, locale }: CartItemProps) => {
  const tA11y = useTranslations("A11y");
  const t = useTranslations("Cart");
  const tErr = useTranslations("Errors");
  const { removeItem, updateQuantity } = useCartStore();
  const [isPendingRemove, startRemoveTransition] = useTransition();
  const [isPendingQty, startQtyTransition] = useTransition();
  const [localQty, setLocalQty] = useState(item.quantity);

  const name = getLocalizedField(item.product, "name", locale);
  const image = item.product.images[0]?.url || "/placeholder.webp";
  const altText = item.product.images[0]?.altText || name;
  const unitPrice = item.product.discountPrice ?? item.product.price;

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1 || newQty > 99) return;
    setLocalQty(newQty);

    updateQuantity(item.id, newQty);
    startQtyTransition(async () => {
      try {
        unwrapActionResult(await updateCartItemAction(item.id, newQty), tErr("updateQuantity"));
      } catch (error) {
        setLocalQty(item.quantity);
        updateQuantity(item.id, item.quantity);
        toast.error(error instanceof Error ? error.message : tErr("updateQuantity"));
      }
    });
  };

  const handleRemove = () => {
    removeItem(item.id);
    startRemoveTransition(async () => {
      try {
        await removeCartItemAction(item.id);
        toast.success(t("removeSuccess"));
      } catch {
        toast.error(tErr("removeItem"));
      }
    });
  };

  return (
    <div className={styles.item}>
      <Link href={`/product/${item.product.slug}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <SkeletonImage
            src={image}
            alt={altText}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 80px, 100px"
          />
        </div>
      </Link>

      <div className={styles.details}>
        <div className={styles.header}>
          <Link href={`/product/${item.product.slug}`} className={styles.name}>
            {name}
          </Link>
          <button
            className={styles.removeBtn}
            onClick={handleRemove}
            disabled={isPendingRemove}
            aria-label={t("remove")}
          >
            {isPendingRemove ? (
              <Loader2 size={16} className={styles.spinner} />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>

        {(item.variant?.size || item.variant?.colorUk || item.variant?.colorEn) && (
          <div className={styles.meta}>
            {item.variant.size && (
              <span className={styles.metaChip}>
                {t("size")}: <strong>{item.variant.size}</strong>
              </span>
            )}
            {getLocalizedField(item.variant, "color", locale) && (
              <span className={styles.metaChip}>
                {t("color")}: <strong>{getLocalizedField(item.variant, "color", locale)}</strong>
              </span>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.quantityStepper}>
            <button
              className={styles.stepperBtn}
              onClick={() => handleQuantityChange(localQty - 1)}
              disabled={localQty <= 1 || isPendingQty}
              aria-label={tA11y("decreaseQuantity")}
            >
              <Minus size={14} />
            </button>
            <span className={styles.qty}>{localQty}</span>
            <button
              className={styles.stepperBtn}
              onClick={() => handleQuantityChange(localQty + 1)}
              disabled={localQty >= 99 || isPendingQty}
              aria-label={tA11y("increaseQuantity")}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className={styles.priceBlock}>
            <PriceDisplay
              price={item.product.price * localQty}
              discountPrice={item.product.discountPrice ? unitPrice * localQty : null}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
