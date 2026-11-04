"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTopLoader } from "nextjs-toploader";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, X } from "lucide-react";

import { SkeletonImage } from "@/components/ui/SkeletonImage/SkeletonImage";

import { SearchFormData, getSearchSchema } from "./schemas/search.schema";

import { formatPrice } from "@/common/utils/format";

import styles from "./SearchInput.module.css";

interface SuggestionProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  discountPrice: number | null;
  image: string | null;
  categorySlug: string;
}

export const SearchInput = () => {
  const tA11y = useTranslations("A11y");
  const router = useRouter();
  const tSearch = useTranslations("Search");
  const tNavbar = useTranslations("Navbar");
  const locale = useLocale();
  const loader = useTopLoader();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const { register, handleSubmit, setValue, reset } = useForm<SearchFormData>({
    resolver: zodResolver(getSearchSchema(tSearch)),
    defaultValues: { query: "" },
    shouldFocusError: false,
  });

  const fetchSuggestions = useCallback(
    async (q: string) => {
      // A slower earlier response must not overwrite the results for the current text.
      requestRef.current?.abort();

      if (q.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      const request = new AbortController();
      requestRef.current = request;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`, {
          signal: request.signal,
        });
        const data = await res.json();
        setSuggestions(data.products ?? []);
        setIsOpen(true);
      } catch {
        if (!request.signal.aborted) setSuggestions([]);
      } finally {
        if (!request.signal.aborted) setIsLoading(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query) {
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setValue("query", val);
    setActiveIndex(-1);

    if (!val) {
      requestRef.current?.abort();
      setIsLoading(false);
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    requestRef.current?.abort();
    setIsLoading(false);
    setQuery("");
    reset({ query: "" });
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) {
        setIsOpen(false);
        router.push(`/product/${selected.slug}`);
      }
    }
  };

  const onSubmit = (data: SearchFormData) => {
    setIsOpen(false);
    loader.start();
    router.push(`/search?q=${encodeURIComponent(data.query)}`);
  };

  return (
    <div ref={wrapperRef} className={styles.searchContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.searchWrapper}>
        <input
          {...register("query")}
          className={styles.searchInput}
          type="text"
          placeholder={tNavbar("searchPlaceholder")}
          aria-label={tA11y("search")}
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        />
        {query && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label={tA11y("clearSearch")}
          >
            <X size={14} />
          </button>
        )}
        <button
          type="submit"
          className={styles.searchButton}
          aria-label={tA11y("submitSearch")}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner} />
          ) : (
            <Search className={styles.searchIcon} size={18} />
          )}
        </button>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className={styles.dropdown}>
          <ul className={styles.suggestionList} role="listbox">
            {suggestions.map((product, index) => (
              <li key={product.id} role="option" aria-selected={activeIndex === index}>
                <Link
                  href={`/product/${product.slug}`}
                  className={`${styles.suggestionItem} ${activeIndex === index ? styles.suggestionItemActive : ""}`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={styles.suggestionImage}>
                    {product.image ? (
                      <SkeletonImage
                        src={product.image}
                        alt={product.name}
                        fill
                        className={styles.suggestionImg}
                        sizes="48px"
                      />
                    ) : (
                      <div className={styles.suggestionImgPlaceholder} />
                    )}
                  </div>
                  <div className={styles.suggestionInfo}>
                    <span className={styles.suggestionName}>{product.name}</span>
                    <span className={styles.suggestionPrice}>
                      {product.discountPrice ? (
                        <>
                          <span className={styles.suggestionDiscountPrice}>
                            {formatPrice(product.discountPrice, locale)}
                          </span>
                          <span className={styles.suggestionOldPrice}>
                            {formatPrice(product.price, locale)}
                          </span>
                        </>
                      ) : (
                        formatPrice(product.price, locale)
                      )}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.dropdownFooter}>
            <button
              type="button"
              className={styles.showAllButton}
              onClick={() => {
                setIsOpen(false);
                loader.start();
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }}
            >
              {tNavbar("searchShowAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
