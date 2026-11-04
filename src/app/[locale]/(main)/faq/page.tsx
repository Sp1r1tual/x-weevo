import { getTranslations, setRequestLocale } from "next-intl/server";

import { FaqPageClient } from "./_components/FaqPageClient/FaqPageClient";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [{ locale: "uk" }, { locale: "en" }];
}

interface RouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RouteProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQ" });
  return {
    title: t("title"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function FAQPage({ params }: RouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "FAQ" });

  return (
    <FaqPageClient
      title={t("title")}
      description={t("metaDescription")}
      items={[
        { title: t("section1Title"), content: t("section1Content") },
        { title: t("section2Title"), content: t("section2Content") },
        { title: t("section3Title"), content: t("section3Content") },
      ]}
    />
  );
}
