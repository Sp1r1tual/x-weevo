"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import { BackButton } from "@/components/ui/BackButton/BackButton";
import { ScrollToTop } from "@/components/ui/ScrollToTop/ScrollToTop";

import styles from "./PolicyLayout.module.css";

interface Section {
  id: string;
  title: string;
  content: string;
}

interface PolicyLayoutProps {
  title: string;
  description?: string;
  sections: Section[];
}

export const PolicyLayout = ({ title, description, sections }: PolicyLayoutProps) => {
  const tCommon = useTranslations("Common");
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <div className={styles.container}>
        <BackButton scrollUp={true} />

        <header className={styles.header}>
          <motion.h1
            className={styles.title}
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              className={styles.description}
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {description}
            </motion.p>
          )}
        </header>

        <div className={styles.mainContent}>
          <aside className={styles.sidebar}>
            <nav className={styles.nav}>
              <span className={styles.navTitle}>{tCommon("tableOfContents")}</span>
              <ul className={styles.navList}>
                {sections.map((section, idx) => (
                  <li key={section.id} className={styles.navItem}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`${styles.navButton} ${
                        activeSection === section.id ? styles.navButtonActive : ""
                      }`}
                    >
                      <span className={styles.navIndex}>{idx + 1}</span>
                      <span className={styles.navText}>{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className={styles.sectionsList}>
            {sections.map((section, idx) => (
              <motion.section
                key={section.id}
                id={section.id}
                className={styles.section}
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
              >
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIndex}>{idx + 1}</span>
                  {section.title}
                </h2>
                <div className={styles.sectionContent}>{section.content}</div>
              </motion.section>
            ))}
          </div>
        </div>
      </div>

      <ScrollToTop />
    </>
  );
};
