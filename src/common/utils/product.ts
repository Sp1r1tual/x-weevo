export const calculateDiscountPercentage = (
  price: number,
  discountPrice: number | null | undefined,
): number => {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

const LETTER_SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL"];

function getSizeRank(size: string) {
  const letterRank = LETTER_SIZE_ORDER.indexOf(size.trim().toUpperCase());
  if (letterRank !== -1) return letterRank;

  const numeric = Number.parseFloat(size);
  return Number.isNaN(numeric) ? Number.POSITIVE_INFINITY : LETTER_SIZE_ORDER.length + numeric;
}

/** Orders clothing sizes the way shoppers expect: S, M, L, XL rather than alphabetically. */
export function compareSizes(a: string, b: string) {
  return getSizeRank(a) - getSizeRank(b) || a.localeCompare(b);
}

export function sortVariantsBySize<T extends { size: string }>(variants: T[]): T[] {
  return [...variants].sort((a, b) => compareSizes(a.size, b.size));
}

export function isVariantInStock(variant: { stock: number }) {
  return variant.stock > 0;
}
