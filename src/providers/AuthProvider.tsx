"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { getCartAction } from "@/actions/cart.actions";
import { getFavoriteIdsAction } from "@/actions/favorites.actions";
import { useRouter } from "@/i18n/navigation";
import type { IUser } from "@/types";

import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import type { CartItem } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";

import { getCurrentUserAction } from "@/common/auth/actions";

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: IUser | null;
  initialCart: CartItem[];
  initialFavorites: string[];
}

async function hydrateUserData() {
  try {
    const [cartItems, favoriteIds] = await Promise.all([
      getCartAction().catch(() => []),
      getFavoriteIdsAction().catch(() => []),
    ]);
    useCartStore.setState({ items: cartItems as never });
    useFavoritesStore.setState({ ids: favoriteIds });
  } catch {
    // silently fail — stores stay empty
  }
}

export const AuthProvider = ({
  children,
  initialUser,
  initialCart,
  initialFavorites,
}: AuthProviderProps) => {
  const router = useRouter();
  const { login, logout } = useAuthStore();
  const tAuth = useTranslations("AuthModal");
  const { status } = useSession();

  const tAuthRef = useRef(tAuth);
  const isHydrated = useRef(Boolean(initialUser));
  const prevStatus = useRef(status);

  useState(() => {
    // These stores are module singletons: on the server they would be shared between requests.
    if (typeof window === "undefined") return;

    useAuthStore.setState({ user: initialUser, isLoading: false });
    useCartStore.setState({ items: initialCart });
    useFavoritesStore.setState({ ids: initialFavorites });
  });

  useEffect(() => {
    tAuthRef.current = tAuth;
  }, [tAuth]);

  useEffect(() => {
    if (status === "loading") return;

    const wasUnauthenticated =
      prevStatus.current === "unauthenticated" || prevStatus.current === "loading";
    const isNowAuthenticated = status === "authenticated";

    if (isNowAuthenticated) {
      getCurrentUserAction()
        .then((user) => {
          if (user) {
            login(user);
            if (!isHydrated.current) {
              isHydrated.current = true;
              void hydrateUserData();
            }

            if (wasUnauthenticated && sessionStorage.getItem("pendingLogin")) {
              sessionStorage.removeItem("pendingLogin");
              toast.success(tAuthRef.current("successMessage", { name: user.name }));
              router.refresh();
            }
          }
        })
        .catch((err) => {
          console.error("Auth sync error:", err);
          logout();
        });
    } else if (status === "unauthenticated") {
      logout();
      isHydrated.current = false;
      useCartStore.setState({ items: [] });
      useFavoritesStore.setState({ ids: [] });
    }

    prevStatus.current = status;
  }, [status, login, logout, router]);

  return <>{children}</>;
};
