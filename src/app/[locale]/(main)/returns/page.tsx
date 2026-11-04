import { getTranslations, setRequestLocale } from "next-intl/server";

import { PolicyLayout } from "@/components/ui/PolicyLayout/PolicyLayout";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [{ locale: "uk" }, { locale: "en" }];
}

interface RouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RouteProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Returns" });
  return {
    title: t("title"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function ReturnsPage({ params }: RouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Returns" });

  const sections = [
    { id: "conditions", title: t("section1Title"), content: t("section1Content") },
    { id: "how-to-return", title: t("section2Title"), content: t("section2Content") },
    { id: "refund-process", title: t("section3Title"), content: t("section3Content") },
  ];

  return <PolicyLayout title={t("title")} description={t("metaDescription")} sections={sections} />;
}
