"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import { useState } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/Button/Button";
import { Drawer } from "@/components/ui/Drawer/Drawer";
import { Input } from "@/components/ui/Input/Input";
import { Select } from "@/components/ui/Select/Select";

import styles from "./FilterSidebar.module.css";

interface FilterSidebarProps {
  availableSizes: string[];
  priceRange?: { min: number; max: number };
}

export const FilterSidebar = ({ availableSizes, priceRange }: FilterSidebarProps) => {
  const tA11y = useTranslations("A11y");
  const t = useTranslations("Catalog");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loader = useTopLoader();

  const [isOpen, setIsOpen] = useState(false);

  const dbMin = priceRange?.min ?? 0;
  const dbMax = priceRange?.max ?? 10000;

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || dbMin.toString());
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || dbMax.toString());
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);

  const [sliderMin, setSliderMin] = useState<number>(
    searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : dbMin,
  );
  const [sliderMax, setSliderMax] = useState<number>(
    searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : dbMax,
  );

  if (searchParams !== prevSearchParams) {
    setPrevSearchParams(searchParams);
    setMinPrice(searchParams.get("minPrice") || dbMin.toString());
    setMaxPrice(searchParams.get("maxPrice") || dbMax.toString());
    setSliderMin(searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : dbMin);
    setSliderMax(searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : dbMax);
  }

  const activeSizes = searchParams.getAll("size");
  const currentSort = searchParams.get("sort") || "newest";

  const handleSizeToggle = (size: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const sizes = params.getAll("size");

    params.delete("size");

    if (sizes.includes(size)) {
      sizes.filter((s) => s !== size).forEach((s) => params.append("size", s));
    } else {
      [...sizes, size].forEach((s) => params.append("size", s));
    }

    params.delete("page");
    loader.start();
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setMinPrice(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      setSliderMin(Math.max(dbMin, Math.min(val, sliderMax - 1)));
    } else {
      setSliderMin(dbMin);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setMaxPrice(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      setSliderMax(Math.min(dbMax, Math.max(val, sliderMin + 1)));
    } else {
      setSliderMax(dbMax);
    }
  };

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), sliderMax - 1);
    setSliderMin(val);
    setMinPrice(val.toString());
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), sliderMin + 1);
    setSliderMax(val);
    setMaxPrice(val.toString());
  };

  const handlePriceApply = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (sliderMin > dbMin) {
      params.set("minPrice", sliderMin.toString());
    } else {
      params.delete("minPrice");
      setMinPrice(dbMin.toString());
    }

    if (sliderMax < dbMax) {
      params.set("maxPrice", sliderMax.toString());
    } else {
      params.delete("maxPrice");
      setMaxPrice(dbMax.toString());
    }

    params.delete("page");
    loader.start();
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "newest") params.delete("sort");
    else params.set("sort", value);

    params.delete("page");
    loader.start();
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("size");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("sort");
    params.delete("page");
    setSliderMin(dbMin);
    setSliderMax(dbMax);
    setMinPrice(dbMin.toString());
    setMaxPrice(dbMax.toString());
    loader.start();
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    if (isOpen) setIsOpen(false);
  };

  const sortOptions = [
    { value: "newest", label: t("sorting.newest") },
    { value: "popular", label: t("sorting.popular") },
    { value: "price-asc", label: t("sorting.price-asc") },
    { value: "price-desc", label: t("sorting.price-desc") },
  ];

  const renderFilters = () => (
    <>
      <div className={styles.filterSection}>
        <h4 className={styles.sectionTitle}>{t("filters.price")}</h4>

        <div className={styles.priceInputs}>
          <Input
            type="number"
            placeholder={t("filters.min")}
            value={minPrice}
            onChange={handleMinInputChange}
            onBlur={handlePriceApply}
            onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
          />
          <span className={styles.priceSeparator}>-</span>
          <Input
            type="number"
            placeholder={t("filters.max")}
            value={maxPrice}
            onChange={handleMaxInputChange}
            onBlur={handlePriceApply}
            onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
          />
        </div>

        <div className={styles.sliderContainer}>
          <div className={styles.sliderTrack} />
          <div
            className={styles.sliderProgress}
            style={{
              left: `${((sliderMin - dbMin) / (dbMax - dbMin)) * 100}%`,
              width: `${((sliderMax - sliderMin) / (dbMax - dbMin)) * 100}%`,
            }}
          />
          <input
            type="range"
            min={dbMin}
            max={dbMax}
            value={sliderMin}
            onChange={handleMinSliderChange}
            onMouseUp={handlePriceApply}
            onTouchEnd={handlePriceApply}
            className={styles.rangeInput}
            aria-label={tA11y("minPrice")}
          />
          <input
            type="range"
            min={dbMin}
            max={dbMax}
            value={sliderMax}
            onChange={handleMaxSliderChange}
            onMouseUp={handlePriceApply}
            onTouchEnd={handlePriceApply}
            className={styles.rangeInput}
            aria-label={tA11y("maxPrice")}
          />
        </div>
      </div>

      {availableSizes.length > 0 && (
        <div className={styles.filterSection}>
          <h4 className={styles.sectionTitle}>{t("filters.sizes")}</h4>
          <div className={styles.sizeGrid}>
            {availableSizes.map((size) => (
              <button
                key={size}
                className={`${styles.sizeButton} ${activeSizes.includes(size) ? styles.active : ""}`}
                onClick={() => handleSizeToggle(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className={styles.mobileActions}>
        <Button
          variant="secondary"
          fullWidth
          icon={<SlidersHorizontal size={18} />}
          onClick={() => setIsOpen(true)}
        >
          {t("filters.title")}
        </Button>
      </div>

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("filters.title")}
        direction="right"
      >
        <div className={styles.drawerInner}>
          <div className={`${styles.filterSection} ${styles.mobileOnlySort}`}>
            <h4 className={styles.sectionTitle}>{t("filters.sort")}</h4>
            <Select options={sortOptions} value={currentSort} onChange={handleSortChange} />
          </div>

          {renderFilters()}

          <div className={styles.drawerFooter}>
            <Button variant="ghost" fullWidth onClick={handleClearAll}>
              {t("filters.clear")}
            </Button>
            <Button className={styles.applyBtn} fullWidth onClick={() => setIsOpen(false)}>
              {t("filters.apply")}
            </Button>
          </div>
        </div>
      </Drawer>

      <div className={styles.sidebar}>{renderFilters()}</div>
    </>
  );
};
