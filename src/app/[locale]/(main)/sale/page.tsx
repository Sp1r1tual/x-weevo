import { getTranslations } from "next-intl/server";

import { findAvailableSizes, findPriceRange, findSaleProducts } from "@/db/product";

import { CatalogPage } from "@/components/pages/Catalog/CatalogPage";

interface SaleRouteProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Catalog" });
  const tLayout = await getTranslations({ locale, namespace: "Layout" });

  const title = t("sale");
  return {
    title,
    description: tLayout("description"),
  };
}

export default async function SaleRoute({ params, searchParams }: SaleRouteProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const t = await getTranslations({ locale, namespace: "Catalog" });
  const tDetail = await getTranslations({ locale, namespace: "ProductDetail" });

  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const minPrice = typeof sp.minPrice === "string" ? parseInt(sp.minPrice, 10) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" ? parseInt(sp.maxPrice, 10) : undefined;
  const sortBy = (typeof sp.sort === "string" ? sp.sort : "newest") as
    | "newest"
    | "popular"
    | "price-asc"
    | "price-desc";
  const sizes = sp.size ? (Array.isArray(sp.size) ? sp.size : [sp.size]) : undefined;

  const [availableSizes, priceRange] = await Promise.all([
    findAvailableSizes(),
    findPriceRange(undefined, true),
  ]);

  const { products, totalCount, totalPages, currentPage } = await findSaleProducts({
    minPrice,
    maxPrice,
    sizes,
    sortBy,
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: 12,
  });

  const title = t("sale");
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: tDetail("home"), href: "/" },
    { label: title },
  ];

  return (
    <CatalogPage
      title={title}
      breadcrumbs={breadcrumbs}
      products={products}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      availableSizes={availableSizes}
      priceRange={priceRange}
      locale={locale}
    />
  );
}
