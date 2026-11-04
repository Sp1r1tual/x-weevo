"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";

import { getAddressAction, saveAddressAction } from "@/actions/address.actions";
import { updateProfileAction } from "@/actions/profile.actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Modal } from "@/components/ui/Modal/Modal";

import { useAuthStore } from "@/store/useAuthStore";

import { CARRIER_LOGOS } from "@/common/constants/images/carrier-logos";
import { unwrapActionResult } from "@/common/utils/action-result";
import {
  type AddressFormData,
  CARRIERS,
  type CarrierType,
  getAddressModalSchema,
} from "@/common/validation/profile/schemas/address.schema";

import styles from "./AddressModal.module.css";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddressModal = ({ isOpen, onClose, onSuccess }: AddressModalProps) => {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const schema = useMemo(() => {
    return getAddressModalSchema(!!user?.phone, t);
  }, [user?.phone, t]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    trigger,
    formState: { errors, isValid, isDirty },
  } = useForm<AddressFormData & { phone?: string }>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      carrier: "NOVA_POSHTA",
      city: "",
      warehouse: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      getAddressAction()
        .then((addr) => {
          if (addr && CARRIERS.includes(addr.carrier as CarrierType)) {
            reset({
              carrier: addr.carrier as CarrierType,
              city: addr.city,
              warehouse: addr.warehouse,
              phone: "",
            });
          } else {
            reset({
              carrier: "NOVA_POSHTA",
              city: "",
              warehouse: "",
              phone: "",
            });
          }
          trigger();
        })
        .catch(() => {});
    }
  }, [isOpen, reset, trigger]);

  const carrier = useWatch({ control, name: "carrier" });

  const onSubmit = async (data: AddressFormData & { phone?: string }) => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      const addrData = {
        carrier: data.carrier,
        city: data.city,
        warehouse: data.warehouse,
      };
      if (!user.phone && data.phone) {
        unwrapActionResult(
          await updateProfileAction(
            {
              name: user.name,
              phone: data.phone,
              carrier: data.carrier,
              city: data.city,
              warehouse: data.warehouse,
            },
            locale,
          ),
          t("address.error"),
        );
        updateUser({ phone: data.phone, address: addrData });
      } else {
        unwrapActionResult(await saveAddressAction(addrData), t("address.error"));
        updateUser({ address: addrData });
      }
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("address.error");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t("address.sectionTitle")}</h2>
        <p className={styles.description}>{t("address.modalDescription")}</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <input type="hidden" {...register("carrier")} />
          <div className={styles.formGroup}>
            <span className={styles.label}>{t("address.carrier")}</span>
            <div className={styles.carrierGroup}>
              {CARRIERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.carrierChip} ${carrier === c ? styles.carrierChipActive : ""}`}
                  onClick={() =>
                    setValue("carrier", c, { shouldDirty: true, shouldValidate: true })
                  }
                  disabled={isSubmitting}
                >
                  <div className={styles.carrierLogoWrapper}>
                    <Image
                      src={CARRIER_LOGOS[c]}
                      alt={c}
                      fill
                      sizes="24px"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <span>{t(`address.carriers.${c}`)}</span>
                </button>
              ))}
            </div>
            {errors.carrier && <span className={styles.errorText}>{errors.carrier.message}</span>}
          </div>

          {(!user || !user.phone) && (
            <div className={styles.formGroup}>
              <Input
                label={t("phoneLabel")}
                placeholder={t("phonePlaceholder") || "+380..."}
                {...register("phone")}
                error={errors.phone?.message}
                disabled={isSubmitting}
                type="tel"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <Input
              label={t("address.city")}
              placeholder={t("address.cityPlaceholder")}
              {...register("city")}
              error={errors.city?.message}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              label={t("address.warehouse")}
              placeholder={t("address.warehousePlaceholder")}
              {...register("warehouse")}
              error={errors.warehouse?.message}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              fullWidth
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty || !isValid} fullWidth>
              {isSubmitting ? (
                <Loader2 className={styles.spinnerIcon} size={16} />
              ) : (
                t("address.save")
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
