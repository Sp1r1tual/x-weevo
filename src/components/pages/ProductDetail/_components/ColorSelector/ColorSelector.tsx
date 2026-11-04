"use client";

import styles from "./ColorSelector.module.css";

interface ColorOption {
  key: string;
  label: string;
  isAvailable: boolean;
}

interface ColorSelectorProps {
  label: string;
  options: ColorOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export const ColorSelector = ({ label, options, selectedKey, onSelect }: ColorSelectorProps) => {
  return (
    <div className={styles.container} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`${styles.colorBtn} ${selectedKey === option.key ? styles.selected : ""}`}
          onClick={() => onSelect(option.key)}
          aria-pressed={selectedKey === option.key}
          disabled={!option.isAvailable}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
