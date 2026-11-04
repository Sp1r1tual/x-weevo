import { notFound } from "next/navigation";

import { findProductBySlug } from "@/db/product";

import { ProductDetail } from "@/components/pages/ProductDetail/ProductDetail";
import { JsonLd } from "@/components/ui/JsonLd/JsonLd";

import { BASE_URL } from "@/common/constants/env";
import { getLocalizedField } from "@/common/utils/locale";
import { isVariantInStock } from "@/common/utils/product";
import { getSeoAlternates } from "@/common/utils/seo";

const META_DESCRIPTION_LENGTH = 160;

function getProductDescription(product: object, locale: string) {
  const description = getLocalizedField(product, "seoDescription", locale, "description");
  return description?.slice(0, META_DESCRIPTION_LENGTH);
}

interface ProductRouteProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ProductRouteProps) {
  const { locale, slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    return {};
  }

  const title = getLocalizedField(product, "seoTitle", locale, "name");
  const description = getProductDescription(product, locale);
  const primaryImage = product.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description: description || undefined,
      type: "website",
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
      images: primaryImage ? [primaryImage] : [],
    },
    alternates: getSeoAlternates(locale, `/product/${slug}`),
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { locale, slug } = await params;

  const product = await findProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const name = getLocalizedField(product, "name", locale);
  const description = getProductDescription(product, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || undefined,
    image: product.images.map((img) => img.url),
    url: `${BASE_URL}/${locale}/product/${product.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: product.discountPrice ?? product.price,
      availability: product.variants.some(isVariantInStock)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${BASE_URL}/${locale}/product/${product.slug}`,
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductDetail product={product} locale={locale} />
    </>
  );
}
