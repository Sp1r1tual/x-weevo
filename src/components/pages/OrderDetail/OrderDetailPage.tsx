"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { cancelOrderAction, updateOrderContactAction } from "@/actions/order.actions";
import type { OrderData } from "@/db/order";
import { Link } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, ChevronLeft, Clock, Copy, Package, RefreshCw, Truck, X } from "lucide-react";

import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { ConfirmChoiceModal } from "@/components/ui/Modal/ConfirmChoiceModal";
import { SkeletonImage } from "@/components/ui/SkeletonImage/SkeletonImage";

import { formatDate, formatPrice } from "@/common/utils/format";
import { getOrderItemColor } from "@/common/utils/product";

import { ContactFormData } from "@/types/ui.types";

import styles from "./OrderDetailPage.module.css";

interface OrderDetailPageProps {
  order: OrderData;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock size={16} />,
  PROCESSING: <RefreshCw size={16} className={styles.spin} />,
  SHIPPED: <Truck size={16} />,
  DELIVERED: <CheckCircle size={16} />,
  CANCELLED: <X size={16} />,
  REFUNDED: <RefreshCw size={16} />,
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: styles.pending,
  PROCESSING: styles.processing,
  SHIPPED: styles.shipped,
  DELIVERED: styles.delivered,
  CANCELLED: styles.cancelled,
  REFUNDED: styles.refunded,
};

export const OrderDetailPage = ({ order: initialOrder }: OrderDetailPageProps) => {
  const t = useTranslations("Profile");
  const locale = useLocale();

  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [isEditing, setIsEditing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isEditable = order.status === "PENDING" || order.status === "PROCESSING";

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ContactFormData>({
    defaultValues: {
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      shippingAddress: order.shippingAddress,
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const updated = await updateOrderContactAction(order.id, data);
      setOrder(updated);
      setIsEditing(false);
      toast.success(t("orders.updateSuccess"));
    } catch {
      toast.error(t("orders.updateError"));
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const updated = await cancelOrderAction(order.id);
      setOrder(updated);
      toast.success(t("orders.cancelSuccess"));
    } catch {
      toast.error(t("orders.cancelError"));
    } finally {
      setIsCancelling(false);
      setIsCancelModalOpen(false);
    }
  };

  const productName = (item: OrderData["items"][number]) =>
    locale === "uk" ? item.productNameUk : item.productNameEn;

  return (
    <div className={styles.page}>
      <Link href="/profile" className={styles.backLink}>
        <ChevronLeft size={18} />
        {t("orders.backToProfile")}
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {t("orders.orderNumber", { id: order.id.slice(0, 8).toUpperCase() })}
          </h1>
          {order.trackingNumber && (
            <div className={styles.headerTracking}>
              <span className={styles.trackingLabel}>{t("orders.tracking")}:</span>
              <span className={styles.trackingValue}>{order.trackingNumber}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => {
                  navigator.clipboard.writeText(order.trackingNumber!);
                  toast.success(t("orders.trackingCopied"));
                }}
                title={t("orders.copyTracking")}
              >
                <Copy size={16} />
              </button>
            </div>
          )}
          <p className={styles.date}>{formatDate(order.createdAt, locale, true)}</p>
        </div>
        <span className={`${styles.statusBadge} ${STATUS_CLASS[order.status] ?? ""}`}>
          {STATUS_ICONS[order.status]}
          {t(`orders.statuses.${order.status}`)}
        </span>
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t("orders.items")}</h2>
          <div className={styles.itemsList}>
            {order.items.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemImageWrapper}>
                  {item.product?.images?.[0] ? (
                    <SkeletonImage
                      src={item.product.images[0].url}
                      alt={item.product.images[0].altText ?? productName(item)}
                      fill
                      sizes="72px"
                      className={styles.itemImage}
                    />
                  ) : (
                    <div className={styles.itemImagePlaceholder}>
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{productName(item)}</span>
                  <div className={styles.itemMeta}>
                    {item.productSize && <span className={styles.metaTag}>{item.productSize}</span>}
                    {getOrderItemColor(item, locale) && (
                      <span className={styles.metaTag}>{getOrderItemColor(item, locale)}</span>
                    )}
                    <span className={styles.metaTag}>× {item.quantity}</span>
                  </div>
                </div>
                <span className={styles.itemPrice}>
                  {formatPrice(item.price * item.quantity, locale)}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.totalRow}>
            <span>{t("orders.total")}</span>
            <span className={styles.totalAmount}>{formatPrice(order.totalAmount, locale)}</span>
          </div>
        </section>

        <div className={styles.sideColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t("orders.contactInfo")}</h2>
              {isEditable && !isEditing && (
                <button
                  className={styles.editBtn}
                  onClick={() => {
                    reset({
                      contactName: order.contactName,
                      contactEmail: order.contactEmail,
                      contactPhone: order.contactPhone,
                      shippingAddress: order.shippingAddress,
                    });
                    setIsEditing(true);
                  }}
                >
                  {t("orders.editContacts")}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.form
                  key="edit"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className={styles.editForm}
                >
                  <Input
                    label={t("orders.contactName")}
                    {...register("contactName")}
                    disabled={isSubmitting}
                  />
                  <Input
                    label={t("orders.contactEmail")}
                    type="email"
                    {...register("contactEmail")}
                    disabled={isSubmitting}
                  />
                  <Input
                    label={t("orders.contactPhone")}
                    type="tel"
                    {...register("contactPhone")}
                    disabled={isSubmitting}
                  />
                  <Input
                    label={t("orders.address")}
                    {...register("shippingAddress")}
                    disabled={isSubmitting}
                  />
                  <div className={styles.formActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={isSubmitting}
                    >
                      {t("cancel")}
                    </Button>
                    <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
                      {isSubmitting ? "..." : t("orders.saveChanges")}
                    </Button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={styles.infoGrid}
                >
                  <span className={styles.infoLabel}>{t("orders.contactName")}</span>
                  <span className={styles.infoValue}>{order.contactName}</span>
                  <span className={styles.infoLabel}>{t("orders.contactEmail")}</span>
                  <span className={styles.infoValue}>{order.contactEmail}</span>
                  <span className={styles.infoLabel}>{t("orders.contactPhone")}</span>
                  <span className={styles.infoValue}>{order.contactPhone}</span>
                  <span className={styles.infoLabel}>{t("orders.carrier")}</span>
                  <span className={styles.infoValue}>{order.carrier.replace("_", " ")}</span>
                  <span className={styles.infoLabel}>{t("orders.address")}</span>
                  <span className={styles.infoValue}>{order.shippingAddress}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {isEditable && (
            <Button
              variant="danger"
              fullWidth
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isCancelling}
            >
              {t("orders.cancelOrder")}
            </Button>
          )}
        </div>
      </div>

      <ConfirmChoiceModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
        title={t("orders.cancelConfirmTitle")}
        description={t("orders.cancelConfirmDesc")}
        confirmText={t("orders.cancelOrder")}
        cancelText={t("cancel")}
        isDanger
      />
    </div>
  );
};
