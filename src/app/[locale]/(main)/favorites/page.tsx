import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { getFavoritesAction } from "@/actions/favorites.actions";
import { FavoriteProduct } from "@/db/favorites";

import { FavoritesPage } from "@/components/pages/Favorites/FavoritesPage";

interface FavoritesRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FavoritesRouteProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Favorites" });

  return {
    title: t("title"),
  };
}

export default async function FavoritesRoute({ params }: FavoritesRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialFavorites: FavoriteProduct[] = [];
  try {
    initialFavorites = await getFavoritesAction();
  } catch {
    // User is not authenticated, pass empty array. Page component will show login prompt.
  }

  return <FavoritesPage initialFavorites={initialFavorites} locale={locale} />;
}
