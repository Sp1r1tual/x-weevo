import { getTranslations } from "next-intl/server";

import { Landing } from "@/components/pages/Landing/Landing";

import { getSeoAlternates } from "@/common/utils/seo";

export const revalidate = 3600;

interface LandingRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LandingRouteProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Layout" });

  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: getSeoAlternates(locale, ""),
  };
}

export default function LandingPage() {
  return <Landing />;
}
