"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";

import { usePathname, useRouter } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import styles from "./Pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

export const Pagination = ({ currentPage, totalPages, className = "" }: PaginationProps) => {
  const tA11y = useTranslations("A11y");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    loader.start();
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <nav className={`${styles.pagination} ${className}`} aria-label={tA11y("pagination")}>
      <button
        className={styles.navButton}
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
        aria-label={tA11y("previousPage")}
      >
        <ChevronLeft size={18} />
      </button>

      <div className={styles.pages}>
        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span key={`dots-${index}`} className={styles.dots}>
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              className={`${styles.pageButton} ${isActive ? styles.active : ""}`}
              onClick={() => handlePageChange(pageNum)}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        className={styles.navButton}
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        aria-label={tA11y("nextPage")}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
};
