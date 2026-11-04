import { setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";

import { MainLayout } from "@/components/layout/MainLayout/MainLayout";

interface ShopLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ShopLayout({ children, params }: ShopLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MainLayout>{children}</MainLayout>;
}
