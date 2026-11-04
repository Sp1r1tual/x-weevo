import { getTranslations, setRequestLocale } from "next-intl/server";

import { PolicyLayout } from "@/components/ui/PolicyLayout/PolicyLayout";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [{ locale: "uk" }, { locale: "en" }];
}

interface TermsRouteProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TermsRouteProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });

  return {
    title: t("title"),
    description: t("section1Content"),
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage({ params }: TermsRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Terms" });

  const sections = [
    { id: "acceptance", title: t("section1Title"), content: t("section1Content") },
    { id: "liability", title: t("section2Title"), content: t("section2Content") },
    { id: "intellectual-property", title: t("section3Title"), content: t("section3Content") },
    { id: "changes", title: t("section4Title"), content: t("section4Content") },
  ];

  return <PolicyLayout title={t("title")} sections={sections} />;
}
