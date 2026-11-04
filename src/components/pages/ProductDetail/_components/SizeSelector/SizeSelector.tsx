"use client";

import { isVariantInStock } from "@/common/utils/product";

import styles from "./SizeSelector.module.css";

interface SizeSelectorProps {
  variants: { size: string; stock: number }[];
  selectedSize: string | null;
  onSelect: (size: string) => void;
}

export const SizeSelector = ({ variants, selectedSize, onSelect }: SizeSelectorProps) => {
  return (
    <div className={styles.container}>
      {variants.map((variant) => {
        const isSelected = selectedSize === variant.size;
        const isOutOfStock = !isVariantInStock(variant);

        return (
          <button
            key={variant.size}
            className={`
              ${styles.sizeBtn} 
              ${isSelected ? styles.selected : ""}
              ${isOutOfStock ? styles.outOfStock : ""}
            `}
            onClick={() => {
              if (!isOutOfStock) onSelect(variant.size);
            }}
            aria-pressed={isSelected}
            disabled={isOutOfStock}
          >
            {variant.size}
          </button>
        );
      })}
    </div>
  );
};
