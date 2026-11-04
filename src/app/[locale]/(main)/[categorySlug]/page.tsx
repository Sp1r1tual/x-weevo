import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { findAllDescendantCategoryIds, findCategoryBySlug } from "@/db/category";
import { findAvailableSizes, findPriceRange, findPublishedProducts } from "@/db/product";

import { CatalogPage } from "@/components/pages/Catalog/CatalogPage";

import { getLocalizedField } from "@/common/utils/locale";
import { getSeoAlternates } from "@/common/utils/seo";

export const revalidate = 300;

interface CategoryRouteProps {
  params: Promise<{ locale: string; categorySlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string }>;
}) {
  const { locale, categorySlug } = await params;
  const category = await findCategoryBySlug(categorySlug);

  if (!category) return {};

  const title = getLocalizedField(category, "name", locale);
  const description = getLocalizedField(category, "seoDescription", locale);

  return {
    title,
    description: description || undefined,
    openGraph: {
      title,
      description: description || undefined,
    },
    alternates: getSeoAlternates(locale, `/${categorySlug}`),
  };
}

export default async function CategoryRoute({ params, searchParams }: CategoryRouteProps) {
  const { locale, categorySlug } = await params;
  const sp = await searchParams;

  const category = await findCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  let targetCategoryIds: string[] = [];
  const selectedSubcategorySlug = typeof sp.subcategory === "string" ? sp.subcategory : undefined;

  if (selectedSubcategorySlug) {
    const selectedSub = category.children.find((c) => c.slug === selectedSubcategorySlug);
    if (!selectedSub) notFound();
    targetCategoryIds = [selectedSub.id];
  } else {
    const descendantIds = await findAllDescendantCategoryIds(category.id);
    targetCategoryIds = [category.id, ...descendantIds];
  }

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
    findAvailableSizes(targetCategoryIds),
    findPriceRange(targetCategoryIds),
  ]);

  const { products, totalCount, totalPages, currentPage } = await findPublishedProducts({
    categoryIds: targetCategoryIds,
    minPrice,
    maxPrice,
    sizes,
    sortBy,
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: 12,
  });

  const title = getLocalizedField(category, "name", locale);
  const description = getLocalizedField(category, "seoDescription", locale);
  const tDetail = await getTranslations({ locale, namespace: "ProductDetail" });

  const breadcrumbs: { label: string; href?: string }[] = [{ label: tDetail("home"), href: "/" }];

  if (category.parent) {
    breadcrumbs.push({
      label: getLocalizedField(category.parent, "name", locale),
      href: `/${category.parent.slug}`,
    });
  }

  breadcrumbs.push({ label: title });

  return (
    <CatalogPage
      title={title}
      description={description || undefined}
      breadcrumbs={breadcrumbs}
      subcategories={category.children}
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
