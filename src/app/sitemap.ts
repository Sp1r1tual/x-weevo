import { MetadataRoute } from "next";

import { prisma } from "@/libs/prisma";

import { BASE_URL } from "@/common/constants/env";

export const revalidate = 3600;

const LOCALES = ["uk", "en"];

function buildAlternates(path: string) {
  return {
    languages: Object.fromEntries(
      LOCALES.map((locale) => [locale, `${BASE_URL}/${locale}${path}`]),
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "/",
    "/catalog",
    "/new-arrivals",
    "/sale",
    "/privacy",
    "/terms",
    "/faq",
    "/shipping-delivery",
    "/returns",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}${route === "/" ? "" : route}`,
      lastModified: new Date(),
      changeFrequency: route === "/" ? "weekly" : "monthly",
      priority: route === "/" ? 1.0 : 0.7,
      alternates: buildAlternates(route === "/" ? "" : route),
    })),
  );

  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  });

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap(
    (cat: { slug: string; updatedAt: Date }) =>
      LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: buildAlternates(`/${cat.slug}`),
      })),
  );

  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { slug: true, updatedAt: true },
  });

  const productEntries: MetadataRoute.Sitemap = products.flatMap(
    (product: { slug: string; updatedAt: Date }) =>
      LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: buildAlternates(`/product/${product.slug}`),
      })),
  );

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
