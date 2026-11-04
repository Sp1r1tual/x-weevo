"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ArrowUp } from "lucide-react";

import styles from "./ScrollToTop.module.css";

export const ScrollToTop = () => {
  const tA11y = useTranslations("A11y");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.button} ${isVisible ? styles.visible : ""}`}
        onClick={handleClick}
        aria-label={tA11y("scrollToTop")}
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
};
