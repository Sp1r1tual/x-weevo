import { invalidateProductCache, productCache } from "@/libs/cache";
import { prisma } from "@/libs/prisma";
import { Prisma } from "@prisma/client";

import { ITEMS_PER_PAGE } from "@/common/constants/pagination";
import { compareSizes, sortVariantsBySize } from "@/common/utils/product";
import type { ProductFormData } from "@/common/validation/product/product.schema";

import { ProductFilters } from "@/types/product.types";

function buildProductOrderBy(sortBy?: string): Prisma.ProductOrderByWithRelationInput[] {
  // The id tie-breaker keeps pagination stable when many products share a sort value.
  const tieBreaker = { id: "asc" } as const;

  switch (sortBy) {
    case "price-asc":
      return [{ price: "asc" }, tieBreaker];
    case "price-desc":
      return [{ price: "desc" }, tieBreaker];
    case "popular":
      return [{ isFeatured: "desc" }, { publishedAt: "desc" }, tieBreaker];
    case "newest":
    default:
      return [{ publishedAt: "desc" }, tieBreaker];
  }
}

const productCardSelect = {
  id: true,
  nameUk: true,
  nameEn: true,
  slug: true,
  price: true,
  discountPrice: true,
  isFeatured: true,
  images: {
    select: { url: true, altText: true },
    orderBy: { order: "asc" },
    take: 2,
  },
  variants: {
    select: { size: true, stock: true },
  },
  category: {
    select: { nameUk: true, nameEn: true, slug: true },
  },
} as const;

export async function findProducts() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      nameUk: true,
      nameEn: true,
      slug: true,
      price: true,
      discountPrice: true,
      status: true,
      isFeatured: true,
      createdAt: true,
      category: { select: { nameUk: true, nameEn: true } },
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
      variants: {
        select: { size: true, stock: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((product) => ({
    ...product,
    variants: sortVariantsBySize(product.variants),
  }));
}

export async function findCategories() {
  return prisma.category.findMany({
    select: { id: true, nameUk: true, nameEn: true, parentId: true },
    orderBy: { nameUk: "asc" },
  });
}

export async function insertProduct(data: ProductFormData) {
  const { images, variants, discountPrice, ...productData } = data;

  const discount = discountPrice !== null && discountPrice !== undefined ? discountPrice : null;

  return prisma.product.create({
    data: {
      ...productData,
      discountPrice: discount,
      publishedAt: productData.status === "PUBLISHED" ? new Date() : null,
      images: {
        create: images.map((img, index) => ({
          url: img.url,
          altText: img.altText || null,
          isPrimary: img.isPrimary,
          order: index,
        })),
      },
      variants: {
        create: variants.map((v) => ({
          size: v.size,
          colorUk: v.colorUk || null,
          colorEn: v.colorEn || null,
          sku: v.sku || null,
          stock: v.stock,
        })),
      },
    },
    select: { id: true, slug: true },
  });
}

export async function softDeleteProduct(id: string) {
  const product = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  invalidateProductCache(product.slug);

  return product;
}

export async function findProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id, deletedAt: null },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
      variants: true,
    },
  });

  if (!product) return null;

  return { ...product, variants: sortVariantsBySize(product.variants) };
}

export async function updateProductInDb(id: string, data: ProductFormData) {
  const { images, variants, discountPrice, ...productData } = data;

  const discount = discountPrice !== null && discountPrice !== undefined ? discountPrice : null;

  const currentProduct = await prisma.product.findUnique({
    where: { id },
    select: { status: true, publishedAt: true, slug: true },
  });

  if (!currentProduct) {
    throw new Error("Product not found");
  }

  let publishedAt = currentProduct.publishedAt;
  if (productData.status === "PUBLISHED" && currentProduct.status !== "PUBLISHED") {
    publishedAt = new Date();
  } else if (productData.status !== "PUBLISHED") {
    publishedAt = null;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        ...productData,
        discountPrice: discount,
        publishedAt: publishedAt,
      },
    });

    await tx.productImage.deleteMany({
      where: { productId: id },
    });

    await tx.productImage.createMany({
      data: images.map((img, index) => ({
        productId: id,
        url: img.url,
        altText: img.altText || null,
        isPrimary: img.isPrimary,
        order: index,
      })),
    });

    const existingVariants = await tx.productVariant.findMany({
      where: { productId: id },
    });

    const incomingVariants = variants.map((v) => ({
      size: v.size,
      colorUk: v.colorUk || null,
      colorEn: v.colorEn || null,
      sku: v.sku || null,
      stock: v.stock,
    }));

    const variantsToCreate: typeof incomingVariants = [];
    const variantsToUpdate: {
      id: string;
      colorEn: string | null;
      sku: string | null;
      stock: number;
    }[] = [];
    const matchedVariantIds = new Set<string>();

    for (const incoming of incomingVariants) {
      const match = existingVariants.find(
        (ev) =>
          ev.size.toLowerCase() === incoming.size.toLowerCase() &&
          (ev.colorUk || "").toLowerCase() === (incoming.colorUk || "").toLowerCase(),
      );

      if (match) {
        matchedVariantIds.add(match.id);
        variantsToUpdate.push({
          id: match.id,
          colorEn: incoming.colorEn,
          sku: incoming.sku,
          stock: incoming.stock,
        });
      } else {
        variantsToCreate.push(incoming);
      }
    }

    const deleteIds = existingVariants
      .filter((ev) => !matchedVariantIds.has(ev.id))
      .map((ev) => ev.id);

    if (deleteIds.length > 0) {
      await tx.productVariant.deleteMany({
        where: { id: { in: deleteIds } },
      });
    }

    if (variantsToCreate.length > 0) {
      await tx.productVariant.createMany({
        data: variantsToCreate.map((v) => ({
          productId: id,
          size: v.size,
          colorUk: v.colorUk,
          colorEn: v.colorEn,
          sku: v.sku,
          stock: v.stock,
        })),
      });
    }

    for (const update of variantsToUpdate) {
      await tx.productVariant.update({
        where: { id: update.id },
        data: {
          colorEn: update.colorEn,
          sku: update.sku,
          stock: update.stock,
        },
      });
    }

    return { id };
  });

  // Invalidate after commit so a concurrent read cannot re-cache the old data.
  invalidateProductCache(currentProduct.slug);
  if (productData.slug && productData.slug !== currentProduct.slug) {
    invalidateProductCache(productData.slug);
  }

  return result;
}

export * from "@/types/product.types";

export async function findPublishedProducts(filters: ProductFilters = {}) {
  const {
    categoryIds,
    minPrice,
    maxPrice,
    sizes,
    sortBy = "newest",
    page = 1,
    limit = ITEMS_PER_PAGE,
  } = filters;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
  };

  if (categoryIds && categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.OR = [
      {
        discountPrice: {
          not: null,
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      },

      {
        discountPrice: null,
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      },
    ];
  }

  if (sizes && sizes.length > 0) {
    where.variants = { some: { size: { in: sizes }, stock: { gt: 0 } } };
  }

  const orderBy = buildProductOrderBy(sortBy);

  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

export async function findProductBySlug(slug: string) {
  const cacheKey = `product:slug:${slug}`;
  const cached = productCache.get(cacheKey);
  if (cached) return cached as Awaited<ReturnType<typeof _findProductBySlug>>;
  const result = await _findProductBySlug(slug);
  if (result) productCache.set(cacheKey, result);
  return result;
}

async function _findProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
    include: {
      images: { orderBy: { order: "asc" } },
      variants: { orderBy: { colorUk: "asc" } },
      category: {
        select: {
          nameUk: true,
          nameEn: true,
          slug: true,
          parent: { select: { nameUk: true, nameEn: true, slug: true } },
        },
      },
      relatedProducts: {
        where: { deletedAt: null, status: "PUBLISHED" },
        select: productCardSelect,
        take: 8,
      },
    },
  });

  if (!product) return null;

  return { ...product, variants: sortVariantsBySize(product.variants) };
}

export async function findSaleProducts(filters: Omit<ProductFilters, "categoryIds"> = {}) {
  const {
    minPrice,
    maxPrice,
    sizes,
    sortBy = "newest",
    page = 1,
    limit = ITEMS_PER_PAGE,
  } = filters;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
    discountPrice: { not: null },
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.discountPrice = {
      not: null,
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  if (sizes && sizes.length > 0) {
    where.variants = { some: { size: { in: sizes }, stock: { gt: 0 } } };
  }

  const orderBy = buildProductOrderBy(sortBy);

  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

export async function findAvailableSizes(categoryIds?: string[]) {
  const variantWhere: {
    stock: { gt: number };
    product: { deletedAt: null; status: "PUBLISHED"; categoryId?: { in: string[] } };
  } = {
    stock: { gt: 0 },
    product: { deletedAt: null, status: "PUBLISHED" },
  };

  if (categoryIds && categoryIds.length > 0) {
    variantWhere.product.categoryId = { in: categoryIds };
  }

  const variants = await prisma.productVariant.findMany({
    where: variantWhere,
    select: { size: true },
    distinct: ["size"],
  });

  return variants.map((v) => v.size).sort(compareSizes);
}

export async function searchProducts(
  query: string,
  { page = 1, limit = ITEMS_PER_PAGE }: { page?: number; limit?: number } = {},
) {
  // Postgres rejects NUL bytes in text, and an empty query should not list the whole catalog.
  const normalizedQuery = query.replaceAll("\0", "").trim();

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
    OR: [
      { nameUk: { contains: normalizedQuery, mode: "insensitive" } },
      { nameEn: { contains: normalizedQuery, mode: "insensitive" } },
    ],
  };

  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: normalizedQuery ? where : { id: { in: [] } },
      select: productCardSelect,
      orderBy: buildProductOrderBy("newest"),
      skip,
      take: limit,
    }),
    normalizedQuery ? prisma.product.count({ where }) : 0,
  ]);

  return {
    products: products,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

export async function findPriceRange(categoryIds?: string[], onlyOnSale = false) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
  };

  if (categoryIds && categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }

  if (onlyOnSale) {
    where.discountPrice = { not: null };
  }

  const result = await prisma.product.aggregate({
    where,
    _min: {
      price: true,
      discountPrice: true,
    },
    _max: {
      price: true,
    },
  });

  const minPrice = Math.min(
    result._min.price || 0,
    result._min.discountPrice || result._min.price || 0,
  );

  const maxPrice = result._max.price || 0;

  return {
    min: Math.floor(minPrice),
    max: Math.ceil(maxPrice),
  };
}
