"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";

import { updateAdminOrderStatusAction } from "@/actions/admin.order.actions";
import type { AdminOrderData } from "@/db/order";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Check, Package, Truck, User } from "lucide-react";

import { ORDER_STATUS_TRANSITIONS } from "@/common/constants/order";
import { unwrapActionResult } from "@/common/utils/action-result";
import { formatPrice } from "@/common/utils/format";
import { getLocalizedField } from "@/common/utils/locale";
import { getOrderItemColor } from "@/common/utils/product";

import styles from "./AdminOrderDetail.module.css";

type Props = {
  order: AdminOrderData;
};

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "statusPending",
  PROCESSING: "statusProcessing",
  SHIPPED: "statusShipped",
  DELIVERED: "statusDelivered",
  CANCELLED: "statusCancelled",
  REFUNDED: "statusRefunded",
};

export const AdminOrderDetail = ({ order }: Props) => {
  const t = useTranslations("Admin.orders");
  const locale = useLocale();

  const [selectedStatus, setSelectedStatus] = useState<string>(order.status);
  const [trackingNumber, setTrackingNumber] = useState<string>(order.trackingNumber ?? "");
  const [savingStatus, setSavingStatus] = useState(false);

  const handleSaveStatus = async () => {
    if (selectedStatus === order.status && trackingNumber === (order.trackingNumber ?? "")) return;
    setSavingStatus(true);
    try {
      unwrapActionResult(
        await updateAdminOrderStatusAction(order.id, selectedStatus, trackingNumber.trim() || null),
        t("detail.statusError"),
      );
      toast.success(t("detail.statusUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("detail.statusError"));
      setSelectedStatus(order.status);
    } finally {
      setSavingStatus(false);
    }
  };

  const styleKey = STATUS_STYLE[order.status as OrderStatus] ?? "statusPending";

  const CARRIER_KEYS = ["NOVA_POSHTA", "UKRPOSHTA", "MEEST", "COURIER", "SELF_PICKUP"] as const;
  const isKnownCarrier = (CARRIER_KEYS as readonly string[]).includes(order.carrier);
  const carrierLabel = isKnownCarrier
    ? t(`carriers.${order.carrier}` as Parameters<typeof t>[0])
    : order.carrier;

  return (
    <div className={styles.layout}>
      <div className={styles.backRow}>
        <Link href="/admin/orders" className={styles.backLink}>
          <ArrowLeft size={16} />
          {t("backToOrders")}
        </Link>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Truck size={18} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>{t("detail.statusSection")}</h2>
            </div>

            <div className={styles.currentStatusRow}>
              <span className={styles.label}>{t("detail.currentStatus")}</span>
              <span className={`${styles.statusBadge} ${styles[styleKey]}`}>
                {t(`statuses.${order.status}` as Parameters<typeof t>[0])}
              </span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t("detail.changeStatus")}</label>
              <div className={styles.statusGrid}>
                {ORDER_STATUSES.map((s) => {
                  const sk = STATUS_STYLE[s];
                  const isActive = selectedStatus === s;
                  const isAvailable =
                    s === order.status ||
                    ORDER_STATUS_TRANSITIONS[order.status as OrderStatus].includes(s);
                  return (
                    <button
                      key={s}
                      disabled={!isAvailable}
                      onClick={() => setSelectedStatus(s)}
                      className={`${styles.statusOption} ${isActive ? styles.statusOptionActive : ""} ${styles[`statusOption_${sk}`]}`}
                    >
                      {isActive && <Check size={12} className={styles.checkIcon} />}
                      {t(`statuses.${s}` as Parameters<typeof t>[0])}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="trackingNumber">
                {t("detail.trackingNumber")}
              </label>
              <input
                id="trackingNumber"
                type="text"
                className={styles.input}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder={t("detail.trackingPlaceholder")}
              />
            </div>

            <button className={styles.saveBtn} onClick={handleSaveStatus} disabled={savingStatus}>
              {savingStatus ? "..." : t("detail.saveStatus")}
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Package size={18} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>{t("detail.orderInfo")}</h2>
            </div>

            <dl className={styles.infoGrid}>
              <dt className={styles.dt}>{t("detail.date")}</dt>
              <dd className={styles.dd}>
                {new Date(order.createdAt).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </dd>

              <dt className={styles.dt}>{t("detail.total")}</dt>
              <dd className={styles.dd}>
                <strong>{formatPrice(order.totalAmount, locale)}</strong>
              </dd>

              <dt className={styles.dt}>{t("detail.carrier")}</dt>
              <dd className={styles.dd}>{carrierLabel}</dd>

              <dt className={styles.dt}>{t("detail.address")}</dt>
              <dd className={styles.dd}>{order.shippingAddress}</dd>

              <dt className={styles.dt}>{t("detail.tracking")}</dt>
              <dd className={styles.dd}>
                {order.trackingNumber ? (
                  <span className={styles.trackingValue}>{order.trackingNumber}</span>
                ) : (
                  <span className={styles.noData}>{t("detail.noTracking")}</span>
                )}
              </dd>
            </dl>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <User size={18} className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>{t("detail.contactInfo")}</h2>
            </div>

            <dl className={styles.infoGrid}>
              <dt className={styles.dt}>{t("detail.contactName")}</dt>
              <dd className={styles.dd}>{order.contactName}</dd>

              <dt className={styles.dt}>{t("detail.contactEmail")}</dt>
              <dd className={styles.dd}>{order.contactEmail}</dd>

              <dt className={styles.dt}>{t("detail.contactPhone")}</dt>
              <dd className={styles.dd}>{order.contactPhone}</dd>
            </dl>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t("detail.items")}</h2>
              <span className={styles.itemCount}>{order.items.length}</span>
            </div>

            <div className={styles.itemsList}>
              {order.items.map((item) => {
                const imgUrl = item.product?.images?.[0]?.url;
                const name = getLocalizedField(item, "productName", locale);
                return (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemThumb}>
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={name}
                          width={56}
                          height={56}
                          className={styles.thumbImg}
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder} />
                      )}
                    </div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{name}</p>
                      <div className={styles.itemMeta}>
                        {item.productSize && (
                          <span className={styles.metaTag}>{item.productSize}</span>
                        )}
                        {getOrderItemColor(item, locale) && (
                          <span className={styles.metaTag}>{getOrderItemColor(item, locale)}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.itemPricing}>
                      <span className={styles.itemQty}>× {item.quantity}</span>
                      <span className={styles.itemPrice}>
                        {formatPrice(item.price * item.quantity, locale)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>{t("detail.total")}</span>
              <span className={styles.totalValue}>{formatPrice(order.totalAmount, locale)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
