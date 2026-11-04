"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "react-toastify";

import { getAddressAction } from "@/actions/address.actions";
import { clearCartAction } from "@/actions/cart.actions";
import { createOrderAction } from "@/actions/order.actions";
import { AnimatedCartLoader } from "@/app/[locale]/(main)/cart/_components/AnimatedCartLoader/AnimatedCartLoader";
import { Link, useRouter } from "@/i18n/navigation";
import { ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ConfirmChoiceModal } from "@/components/ui/Modal/ConfirmChoiceModal";

import { AddressModal } from "./_components/AddressModal/AddressModal";
import { CartItem } from "./_components/CartItem/CartItem";
import { CartItemSkeleton } from "./_components/CartItemSkeleton/CartItemSkeleton";
import { CartSummary } from "./_components/CartSummary/CartSummary";
import { CartSummarySkeleton } from "./_components/CartSummarySkeleton/CartSummarySkeleton";

import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";
import { useModalStore } from "@/store/useModalStore";

import { unwrapActionResult } from "@/common/utils/action-result";

import styles from "./CartPage.module.css";

interface CartPageProps {
  locale: string;
}

export const CartPage = ({ locale }: CartPageProps) => {
  const t = useTranslations("Cart");
  const tErr = useTranslations("Errors");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const openAuthModal = useModalStore((s) => s.openAuthModal);
  const { items, clear, isLoading: isCartLoading } = useCartStore();
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const totalCount = useCartStore(selectCartCount);

  const isLoading = isAuthLoading || isCartLoading;

  const handleClearCart = async () => {
    setIsClearing(true);
    clear();
    try {
      await clearCartAction();
    } catch {
      toast.error(tErr("clearCart"));
    } finally {
      setIsClearing(false);
    }
  };

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const processCheckout = async () => {
    try {
      setIsCheckingOut(true);
      const orderId = unwrapActionResult(await createOrderAction(), t("checkoutError"));
      clear();
      toast.success(t("checkoutSuccess"));
      router.push(`/profile/orders/${orderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("checkoutError"));
      setIsCheckingOut(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      setIsCheckingOut(true);
      const addr = await getAddressAction();

      if (!addr || !addr.carrier || !addr.city || !user.phone) {
        setIsAddressModalOpen(true);
        setIsCheckingOut(false);
        return;
      }

      await processCheckout();
    } catch {
      toast.error(t("checkoutError"));
      setIsCheckingOut(false);
    }
  };

  if (isCheckingOut) {
    return <AnimatedCartLoader text={t("processingOrder")} />;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t("title")}</h1>
          </div>
        </div>
        <div className={styles.layout}>
          <div className={styles.itemsList}>
            <CartItemSkeleton />
            <CartItemSkeleton />
            <CartItemSkeleton />
          </div>
          <aside className={styles.sidebar}>
            <CartSummarySkeleton />
          </aside>
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
          icon={ShoppingCart}
          action={
            <Button onClick={openAuthModal} size="lg" icon={<ShoppingCart size={18} />}>
              {t("loginButton")}
            </Button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
        </div>
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          icon={ShoppingCart}
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
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.subtitle}>{t("itemsCount", { count: totalCount })}</p>
          </div>
          <button
            className={styles.clearBtn}
            onClick={() => setIsClearOpen(true)}
            disabled={isClearing}
            aria-label={t("clearCart")}
          >
            <Trash2 size={16} />
            {t("clearCart")}
          </button>
        </div>

        <div className={styles.layout}>
          <div className={styles.itemsList}>
            {items.map((item) => (
              <CartItem key={item.id} item={item} locale={locale} />
            ))}
          </div>

          <aside className={styles.sidebar}>
            <CartSummary onCheckout={handleCheckout} isCheckingOut={isCheckingOut} />
          </aside>
        </div>
      </div>

      <ConfirmChoiceModal
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={handleClearCart}
        title={t("clearConfirmTitle")}
        description={t("clearConfirmDesc")}
        confirmText={t("clearConfirmYes")}
        cancelText={t("clearConfirmNo")}
        isDanger
      />

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSuccess={() => {
          setIsAddressModalOpen(false);
          void processCheckout();
        }}
      />
    </>
  );
};
