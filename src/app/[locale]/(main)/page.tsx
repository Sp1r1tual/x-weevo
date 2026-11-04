import { getTranslations } from "next-intl/server";

import { Landing } from "@/components/pages/Landing/Landing";
import { JsonLd } from "@/components/ui/JsonLd/JsonLd";

import { CONTACTS } from "@/common/constants/contacts";
import { BASE_URL } from "@/common/constants/env";
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "X-Weevo",
  url: BASE_URL,
  logo: `${BASE_URL}/icon.png`,
  email: CONTACTS.EMAIL,
  telephone: CONTACTS.PHONE.CLEAN,
};

export default function LandingPage() {
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <Landing />
    </>
  );
}
