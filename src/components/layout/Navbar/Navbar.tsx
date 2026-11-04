"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { Heart, ShoppingBag, User } from "lucide-react";

import { useScrollDirection } from "@/hooks/useScrollDirection";

import { Drawer } from "@/components/ui/Drawer/Drawer";
import { Logo } from "@/components/ui/Logo/Logo";
import { SearchInput } from "@/components/ui/SearchInput/SearchInput";

import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useModalStore } from "@/store/useModalStore";

import { CATALOG_LINKS } from "@/common/constants/navigation";

import styles from "./Navbar.module.css";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openAuthModal = useModalStore((s) => s.openAuthModal);
  const pathname = usePathname();
  const t = useTranslations("Navbar");

  const user = useAuthStore((s) => s.user);

  const cartCount = useCartStore(selectCartCount);
  const favCount = useFavoritesStore((s) => s.getCount());

  const isNavbarHidden = useScrollDirection();

  const close = () => setIsMenuOpen(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <nav className={`${styles.navbar} ${isNavbarHidden ? styles.navbarHidden : ""}`}>
        <div className={styles.navContainer}>
          <Logo />

          <ul className={styles.navLinks}>
            {CATALOG_LINKS.map(({ href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.link} ${isActive(href) ? styles.linkActive : ""}`}
                >
                  {t(href.replace("/", ""))}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sale"
                className={`${styles.link} ${styles.linkSale} ${isActive("/sale") ? styles.linkActive : ""}`}
              >
                {t("sale")}
              </Link>
            </li>
          </ul>

          <div className={styles.navActions}>
            <div className={styles.searchHide}>
              <SearchInput />
            </div>
            <Link
              href="/favorites"
              className={`${styles.actionLink} ${isActive("/favorites") ? styles.actionLinkActive : ""}`}
              aria-label={t("favorites")}
              onClick={(e) => isActive("/favorites") && e.preventDefault()}
            >
              <div className={styles.iconWrapper}>
                <Heart size={20} />
                {favCount > 0 && (
                  <span className={styles.badge}>{favCount > 99 ? "99+" : favCount}</span>
                )}
              </div>
            </Link>
            <Link
              href="/cart"
              className={`${styles.actionLink} ${isActive("/cart") ? styles.actionLinkActive : ""}`}
              aria-label={t("cart")}
              onClick={(e) => isActive("/cart") && e.preventDefault()}
            >
              <div className={styles.iconWrapper}>
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className={styles.badge}>{cartCount > 99 ? "99+" : cartCount}</span>
                )}
              </div>
            </Link>
            {user ? (
              <Link
                href="/profile"
                className={`${styles.actionLink} ${isActive("/profile") ? styles.actionLinkActive : ""}`}
                aria-label={t("profile")}
                onClick={(e) => {
                  if (isActive("/profile")) {
                    e.preventDefault();
                  }
                }}
              >
                <User size={20} />
              </Link>
            ) : (
              <button
                className={styles.actionLink}
                aria-label={t("profile")}
                onClick={openAuthModal}
              >
                <User size={20} />
              </button>
            )}

            <button
              className={styles.hamburger}
              onClick={() => setIsMenuOpen(true)}
              aria-label={t("openMenu")}
            >
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </button>
          </div>
        </div>

        <Drawer
          isOpen={isMenuOpen}
          onClose={close}
          direction="right"
          theme="light"
          links={[
            ...CATALOG_LINKS.map(({ href }) => ({
              href,
              label: t(href.replace("/", "")),
            })),
            {
              href: "/sale",
              label: t("sale"),
              isDanger: true,
            },
          ]}
        >
          <div className={styles.drawerSearchWrapper}>
            <SearchInput />
          </div>
        </Drawer>
      </nav>
    </>
  );
};
