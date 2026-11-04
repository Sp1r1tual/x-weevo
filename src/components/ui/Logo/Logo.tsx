import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import styles from "./Logo.module.css";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps) => {
  const tA11y = useTranslations("A11y");
  return (
    <Link href="/" className={`${styles.logoLink} ${className || ""}`} aria-label={tA11y("home")}>
      <span className={styles.logoBlack}>X-</span>
      <span className={styles.logoOrange}>WEEVO</span>
    </Link>
  );
};
