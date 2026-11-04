import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";

import { JsonLd } from "@/components/ui/JsonLd/JsonLd";

import { BASE_URL } from "@/common/constants/env";

import { BreadcrumbItem } from "@/types/ui.types";

import styles from "./Breadcrumbs.module.css";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
  const tA11y = useTranslations("A11y");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <nav aria-label={tA11y("breadcrumb")} className={`${styles.breadcrumbs} ${className}`}>
        <ol className={styles.list}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.label ?? index} className={styles.item}>
                {index > 0 && (
                  <ChevronRight size={14} className={styles.separator} aria-hidden="true" />
                )}
                {isLast || !item.href ? (
                  <span className={styles.current} aria-current={isLast ? "page" : undefined}>
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
