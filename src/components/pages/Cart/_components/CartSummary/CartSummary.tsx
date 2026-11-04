"use client";

import { useLocale, useTranslations } from "next-intl";

import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/Button/Button";

import { selectCartTotal, useCartStore } from "@/store/useCartStore";

import { formatPrice } from "@/common/utils/format";

import styles from "./CartSummary.module.css";

interface CartSummaryProps {
  onCheckout?: () => void;
  isCheckingOut?: boolean;
}

export const CartSummary = ({ onCheckout, isCheckingOut }: CartSummaryProps) => {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectCartTotal);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = subtotal - total;

  const fmt = (n: number) => formatPrice(n, locale);

  return (
    <div className={styles.summary}>
      <h2 className={styles.title}>{t("summary")}</h2>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.label}>{t("subtotal")}</span>
          <span className={styles.value}>{fmt(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className={`${styles.row} ${styles.discountRow}`}>
            <span className={styles.label}>{t("discount")}</span>
            <span className={styles.value}>−{fmt(discount)}</span>
          </div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={`${styles.row} ${styles.totalRow}`}>
        <span className={styles.totalLabel}>{t("total")}</span>
        <span className={styles.totalValue}>{fmt(total)}</span>
      </div>

      <Button
        fullWidth
        size="lg"
        icon={<ShoppingBag size={18} />}
        onClick={onCheckout}
        disabled={isCheckingOut}
        className={styles.checkoutBtn}
      >
        {isCheckingOut ? t("checkoutWait") : t("checkout")}
      </Button>
    </div>
  );
};
