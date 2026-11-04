import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import "react-loading-skeleton/dist/skeleton.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { getCart } from "@/db/cart";
import { getFavoriteIds } from "@/db/favorites";
import { AuthProvider } from "@/providers/AuthProvider";
import { MotionProvider } from "@/providers/MotionProvider";
import { SkeletonProvider } from "@/providers/SkeletonProvider";

import { GlobalAuthModal } from "@/components/ui/Modal/GlobalAuthModal";
import { Modal } from "@/components/ui/Modal/Modal";

import type { CartItem } from "@/store/useCartStore";

import { getCurrentUser } from "@/common/auth/server";
import { BASE_URL } from "@/common/constants/env";
import { geistMono, geistSans } from "@/common/fonts/fonts";

import "@/app/globals.css";

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Layout" });

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: t("title"),
      template: `%s | X-Weevo`,
    },
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: "X-Weevo",
      locale: locale === "uk" ? "uk_UA" : "en_US",
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: "/banner/x-weevo-banner.webp",
          width: 1200,
          height: 630,
          alt: "X-Weevo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/banner/x-weevo-banner.webp"],
    },
  };
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;

  const locales = ["uk", "en"];
  if (!locales.includes(locale)) {
    notFound();
  }

  // Static pages have no request headers, so the locale has to come from the route.
  setRequestLocale(locale);

  const [messages, initialUser] = await Promise.all([getMessages({ locale }), getCurrentUser()]);

  let initialCart: CartItem[] = [];
  let initialFavorites: string[] = [];

  if (initialUser) {
    try {
      [initialCart, initialFavorites] = await Promise.all([
        getCart(initialUser.id),
        getFavoriteIds(initialUser.id),
      ]);
    } catch (e) {
      console.error("Failed to fetch initial user data", e);
    }
  }

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <NextTopLoader
          color="#f59e0b"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #f59e0b,0 0 5px #f59e0b"
        />
        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SkeletonProvider>
              <AuthProvider
                initialUser={initialUser}
                initialCart={initialCart}
                initialFavorites={initialFavorites}
              >
                <MotionProvider>
                  {children}
                  <Modal />
                  <GlobalAuthModal />
                </MotionProvider>
              </AuthProvider>
              <ToastContainer position="top-center" autoClose={3000} />
            </SkeletonProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
