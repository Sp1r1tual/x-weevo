"use client";

import { useTranslations } from "next-intl";
import { ReactNode, useState } from "react";

import { LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Tag } from "lucide-react";

import { Drawer } from "@/components/ui/Drawer/Drawer";

import { DrawerLinkItem } from "@/types/ui.types";

import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/admin/products", translationKey: "nav.products" as const, icon: Package },
  { href: "/admin/categories", translationKey: "nav.categories" as const, icon: Tag },
  { href: "/admin/orders", translationKey: "nav.orders" as const, icon: ShoppingBag },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const tA11y = useTranslations("A11y");
  const t = useTranslations("Admin.layout");
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const drawerLinks: DrawerLinkItem[] = NAV_ITEMS.map(({ href, translationKey, icon }) => ({
    href,
    label: t(translationKey),
    icon,
  }));

  const footerLinks: DrawerLinkItem[] = [
    {
      href: "/",
      label: t("backToSite"),
      icon: LogOut,
    },
  ];

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <LayoutDashboard size={20} />
          <span>{t("title")}</span>
        </div>
        <button
          onClick={toggleMenu}
          className={styles.burgerButton}
          aria-label={tA11y("toggleMenu")}
        >
          <Menu size={24} />
        </button>
      </header>

      <Drawer
        isOpen={isOpen}
        onClose={closeMenu}
        theme="dark"
        title={t("title")}
        titleIcon={LayoutDashboard}
        links={drawerLinks}
        footerLinks={footerLinks}
        backgroundColor="#111111"
      />

      <main className={styles.main}>{children}</main>
    </div>
  );
};
