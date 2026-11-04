import { prisma } from "@/libs/prisma";

import { FavoriteProduct } from "@/types/favorites.types";

export * from "@/types/favorites.types";

export async function getFavorites(userId: string): Promise<FavoriteProduct[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId, product: { deletedAt: null, status: "PUBLISHED" } },
    select: {
      id: true,
      product: {
        select: {
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
            select: { slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((fav) => ({
    id: fav.product.id,
    favoriteId: fav.id,
    product: fav.product,
  }));
}

export async function getFavoriteIds(userId: string): Promise<string[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true },
  });
  return favorites.map((f) => f.productId);
}

export async function addFavorite(userId: string, productId: string) {
  return prisma.favorite.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}

export async function removeFavorite(userId: string, productId: string) {
  return prisma.favorite.deleteMany({
    where: { userId, productId },
  });
}

export async function isFavorited(userId: string, productId: string): Promise<boolean> {
  const fav = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return fav !== null;
}
