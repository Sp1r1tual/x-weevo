import { getTranslations, setRequestLocale } from "next-intl/server";

import { PolicyLayout } from "@/components/ui/PolicyLayout/PolicyLayout";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [{ locale: "uk" }, { locale: "en" }];
}

interface PrivacyRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivacyRouteProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });

  return {
    title: t("title"),
    description: t("section1Content"),
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage({ params }: PrivacyRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Privacy" });

  const sections = [
    { id: "collection", title: t("section1Title"), content: t("section1Content") },
    { id: "usage", title: t("section2Title"), content: t("section2Content") },
    { id: "security", title: t("section3Title"), content: t("section3Content") },
  ];

  return <PolicyLayout title={t("title")} sections={sections} />;
}
