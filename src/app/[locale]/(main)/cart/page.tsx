import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { CartPage } from "@/components/pages/Cart/CartPage";

interface CartRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CartRouteProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cart" });

  return {
    title: t("title"),
  };
}

export default async function CartRoute({ params }: CartRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CartPage locale={locale} />;
}
