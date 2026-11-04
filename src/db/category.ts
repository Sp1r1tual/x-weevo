import { categoryCache, invalidateCategoryCache } from "@/libs/cache";
import { prisma } from "@/libs/prisma";

import { BUILT_IN_SLUGS } from "@/common/constants/categories";
import type { CategoryFormData } from "@/common/validation/category/category.schema";

export async function findAllCategories() {
  return prisma.category.findMany({
    select: {
      id: true,
      nameUk: true,
      nameEn: true,
      slug: true,
      order: true,
      parentId: true,
      parent: { select: { nameUk: true, nameEn: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ order: "asc" }, { nameUk: "asc" }],
  });
}

export async function findCategoryById(id: string) {
  const cacheKey = `category:id:${id}`;
  const cached = categoryCache.get(cacheKey);
  if (cached) return cached as Awaited<ReturnType<typeof _findCategoryById>>;
  const result = await _findCategoryById(id);
  if (result) categoryCache.set(cacheKey, result);
  return result;
}

async function _findCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      nameUk: true,
      nameEn: true,
      slug: true,
      parentId: true,
      order: true,
      seoTitleUk: true,
      seoTitleEn: true,
      seoDescriptionUk: true,
      seoDescriptionEn: true,
    },
  });
}

export async function findCategoriesForSelect() {
  return prisma.category.findMany({
    select: { id: true, nameUk: true, nameEn: true, parentId: true, order: true },
    orderBy: [{ order: "asc" }, { nameUk: "asc" }],
  });
}

export async function insertCategory(data: CategoryFormData) {
  const category = await prisma.category.create({
    data: {
      nameUk: data.nameUk,
      nameEn: data.nameEn,
      slug: data.slug,
      parentId: data.parentId ?? null,
      order: data.order ?? 0,
      seoTitleUk: data.seoTitleUk ?? null,
      seoTitleEn: data.seoTitleEn ?? null,
      seoDescriptionUk: data.seoDescriptionUk ?? null,
      seoDescriptionEn: data.seoDescriptionEn ?? null,
    },
    select: { id: true, slug: true },
  });

  invalidateCategoryCache();
  return category;
}

export async function updateCategory(id: string, data: CategoryFormData) {
  const category = await prisma.category.update({
    where: { id },
    data: {
      nameUk: data.nameUk,
      nameEn: data.nameEn,
      slug: data.slug,
      parentId: data.parentId ?? null,
      order: data.order ?? 0,
      seoTitleUk: data.seoTitleUk ?? null,
      seoTitleEn: data.seoTitleEn ?? null,
      seoDescriptionUk: data.seoDescriptionUk ?? null,
      seoDescriptionEn: data.seoDescriptionEn ?? null,
    },
    select: { id: true, slug: true },
  });

  invalidateCategoryCache();
  return category;
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      slug: true,
      _count: { select: { children: true, products: true } },
    },
  });

  if (!category) throw new Error("NOT_FOUND");
  if (BUILT_IN_SLUGS.includes(category.slug)) {
    throw new Error("CANNOT_DELETE_BASE_CATEGORY");
  }
  if (category._count.children > 0) throw new Error("HAS_CHILDREN");
  if (category._count.products > 0) throw new Error("HAS_PRODUCTS");

  const deleted = await prisma.category.delete({ where: { id } });

  invalidateCategoryCache();
  return deleted;
}

export async function findCategoryBySlug(slug: string) {
  const cacheKey = `category:slug:${slug}`;
  const cached = categoryCache.get(cacheKey);
  if (cached) return cached as Awaited<ReturnType<typeof _findCategoryBySlug>>;
  const result = await _findCategoryBySlug(slug);
  if (result) categoryCache.set(cacheKey, result);
  return result;
}

async function _findCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      nameUk: true,
      nameEn: true,
      slug: true,
      parentId: true,
      seoTitleUk: true,
      seoTitleEn: true,
      seoDescriptionUk: true,
      seoDescriptionEn: true,
      parent: { select: { nameUk: true, nameEn: true, slug: true } },
      children: {
        select: {
          id: true,
          nameUk: true,
          nameEn: true,
          slug: true,
          _count: { select: { products: true } },
        },
        orderBy: [{ order: "asc" }, { nameUk: "asc" }],
      },
    },
  });
}

export async function findAllDescendantCategoryIds(parentId: string): Promise<string[]> {
  const cacheKey = `category:descendants:${parentId}`;
  const cached = categoryCache.get(cacheKey);
  if (cached) return cached as string[];

  const allCategories = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });

  const descendantIds = new Set<string>();

  function collectDescendants(currentParentId: string) {
    for (const cat of allCategories) {
      if (cat.parentId === currentParentId && !descendantIds.has(cat.id)) {
        descendantIds.add(cat.id);
        collectDescendants(cat.id);
      }
    }
  }

  collectDescendants(parentId);
  const result = [...descendantIds];
  categoryCache.set(cacheKey, result);
  return result;
}
