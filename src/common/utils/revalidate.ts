import { revalidatePath } from "next/cache";

import { routing } from "@/i18n/navigation";
import { invalidateProductCache } from "@/libs/cache";

export function revalidateLocalizedPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}${normalizedPath}`);
  }
}

/** Refreshes every public page after the catalog changes in the admin panel. */
export function revalidateStorefront() {
  revalidatePath("/[locale]", "layout");
}

/** Refreshes product pages whose stock changed, e.g. after an order. */
export function revalidateProductPages(slugs: Array<string | null | undefined>) {
  for (const slug of new Set(slugs)) {
    if (!slug) continue;
    invalidateProductCache(slug);
    revalidateLocalizedPath(`/product/${slug}`);
  }
}
