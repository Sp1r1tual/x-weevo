import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Link, usePathname } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Overlay } from "@/components/ui/Overlay/Overlay";

import { DrawerLinkItem } from "@/types/ui.types";

import styles from "./Drawer.module.css";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  links?: DrawerLinkItem[];
  footerLinks?: DrawerLinkItem[];
  title?: string;
  titleIcon?: React.ElementType;
  direction?: "left" | "right";
  theme?: "light" | "dark";
  backgroundColor?: string;
  customButtons?: React.ReactNode;
  children?: React.ReactNode;
}

export const Drawer = ({
  isOpen,
  onClose,
  links = [],
  footerLinks = [],
  title,
  titleIcon: TitleIcon,
  direction = "right",
  theme = "light",
  backgroundColor,
  customButtons,
  children,
}: DrawerProps) => {
  const tA11y = useTranslations("A11y");
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const initialX = direction === "right" ? "100%" : "-100%";

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        setMounted(true);
      }
    }, 0);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  const renderLink = (link: DrawerLinkItem) => {
    const isActive = pathname === link.href;
    const Icon = link.icon;

    const linkClass = [
      styles.drawerLink,
      isActive && styles.drawerLinkActive,
      link.isDanger && styles.drawerLinkDanger,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Link key={link.href} href={link.href} className={linkClass} onClick={onClose}>
        {Icon && <Icon size={18} />}
        {link.label}
      </Link>
    );
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <Overlay onClick={onClose} />

          <motion.div
            className={`${styles.drawer} ${styles[theme]} ${styles[direction]}`}
            style={{ backgroundColor, willChange: "transform" }}
            initial={{ x: initialX }}
            animate={{ x: 0 }}
            exit={{ x: initialX }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
          >
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                {TitleIcon && <TitleIcon size={20} />}
                {title && <span>{title}</span>}
              </div>
              <button
                className={styles.drawerClose}
                onClick={onClose}
                aria-label={tA11y("closeMenu")}
              >
                <X size={24} />
              </button>
            </div>

            <nav className={styles.drawerContent}>
              {children}
              {links.map(renderLink)}
              {customButtons}
            </nav>

            {footerLinks && footerLinks.length > 0 && (
              <div className={styles.drawerFooter}>{footerLinks.map(renderLink)}</div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
