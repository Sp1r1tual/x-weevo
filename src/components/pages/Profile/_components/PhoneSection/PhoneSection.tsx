"use client";

import { useTranslations } from "next-intl";

import { useAuthStore } from "@/store/useAuthStore";

import styles from "./PhoneSection.module.css";

export const PhoneSection = () => {
  const t = useTranslations("Profile");
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className={styles.phoneSection}>
      <span className={styles.label}>{t("phoneLabel")}</span>{" "}
      <span className={styles.phoneValueWrapper}>
        <span className={styles.phoneValue}>{user.phone ? user.phone : t("phoneNotSet")}</span>
      </span>
    </div>
  );
};
