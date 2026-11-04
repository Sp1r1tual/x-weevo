import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { toast } from "react-toastify";

// import appleLogo from "@/assets/others/apple-logo.webp";
import googleLogo from "@/assets/others/google-logo.webp";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";

import styles from "./AuthModal.module.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

function resolveRedirectPath(redirectPath?: string) {
  if (redirectPath) {
    return redirectPath;
  }

  if (typeof window === "undefined") {
    return "/profile";
  }

  return new URLSearchParams(window.location.search).get("next") || "/profile";
}

export const AuthModal = ({ isOpen, onClose, redirectPath }: AuthModalProps) => {
  const t = useTranslations("AuthModal");
  const locale = useLocale();

  const handleGoogleSignIn = async () => {
    try {
      sessionStorage.setItem("pendingLogin", "1");

      const next = resolveRedirectPath(redirectPath);
      const callbackUrl = `/${locale}${next}`;

      await signIn("google", { callbackUrl });
    } catch (error) {
      sessionStorage.removeItem("pendingLogin");
      toast.error(t("errorMessage"));
      console.error(error);
    }
  };

  // const handleAppleSignIn = async () => {
  //   try {
  //     sessionStorage.setItem("pendingLogin", "1");

  //     const next = resolveRedirectPath(redirectPath);
  //     const callbackUrl = `/${locale}${next}`;

  //     await signIn("apple", { callbackUrl });
  //   } catch (error) {
  //     sessionStorage.removeItem("pendingLogin");
  //     const message = error instanceof Error ? error.message : "Failed to sign in with Apple";
  //     toast.error(message);
  //     console.error(error);
  //   }
  // };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>
            <Lock className={styles.lockIcon} size={24} />
          </div>
          <h2 className={styles.title}>{t("title")}</h2>
          <p className={styles.description}>{t("description")}</p>
        </div>

        <div className={styles.divider} />

        <Button
          variant="google"
          fullWidth
          icon={<Image src={googleLogo} alt="Google" width={20} height={20} />}
          onClick={handleGoogleSignIn}
        >
          {t("googleButton")}
        </Button>

        {/* TODO: Увімкнути після налаштування Apple Developer Account
        <Button
          variant="secondary"
          fullWidth
          icon={<Image src={appleLogo} alt="Apple" width={20} height={20} />}
          onClick={handleAppleSignIn}
          aria-label="Sign in with Apple"
        >
          {t("appleButton")}
        </Button>
        */}
      </div>
    </Modal>
  );
};
