"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import styles from "./SectionDots.module.css";

const SECTIONS = [
  { id: "hero", key: "hero" },
  { id: "categories", key: "categories" },
  { id: "about", key: "about" },
  { id: "delivery", key: "delivery" },
  { id: "catalog-cta", key: "catalog-cta" },
];

const HIDE_OFFSET_PX = 350;

export const SectionDots = () => {
  const tA11y = useTranslations("A11y");
  const t = useTranslations("SectionDots");
  const [activeId, setActiveId] = useState<string>("hero");
  const [hideDots, setHideDots] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.35 },
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      setHideDots(scrollY + windowHeight >= documentHeight - HIDE_OFFSET_PX);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const navbarHeight = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav
      className={`${styles.nav} ${hideDots ? styles.hidden : ""}`}
      aria-label={tA11y("sectionNavigation")}
    >
      {SECTIONS.map(({ id, key }) => {
        const label = t(key);
        return (
          <button
            key={id}
            className={`${styles.dot} ${activeId === id ? styles.active : ""}`}
            onClick={() => scrollTo(id)}
            aria-label={label}
          >
            <span className={styles.tooltip}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
