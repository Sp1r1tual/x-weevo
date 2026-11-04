import { getTranslations } from "next-intl/server";

import { searchProducts } from "@/db/product";

import { SearchPage } from "@/components/pages/Search/SearchPage";

interface SearchRouteProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SearchPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: true },
  };
}

export default async function SearchRoute({ params, searchParams }: SearchRouteProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const safePage = isNaN(page) || page < 1 ? 1 : page;

  const { products, totalCount, totalPages, currentPage } = await searchProducts(query, {
    page: safePage,
    limit: 12,
  });

  return (
    <SearchPage
      query={query}
      products={products}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      locale={locale}
    />
  );
}
