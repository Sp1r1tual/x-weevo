"use client";

import { ReactNode, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { AnimatePresence, motion } from "framer-motion";

import { Overlay } from "@/components/ui/Overlay/Overlay";

import { CloseButton } from "./CloseButton";

import { useModalStore } from "@/store/useModalStore";

import styles from "./Modal.module.css";

const emptySubscribe = () => () => {};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

export const Modal = ({ isOpen: isOpenProp, onClose: onCloseProp, children }: ModalProps = {}) => {
  const { isOpen: isOpenStore, content, closeModal: closeStore } = useModalStore();
  const contentRef = useRef<HTMLDivElement>(null);

  const controlled = isOpenProp !== undefined;
  const isOpen = controlled ? isOpenProp : isOpenStore;
  const closeModal = useCallback(
    () => (controlled ? onCloseProp?.() : closeStore()),
    [controlled, onCloseProp, closeStore],
  );
  const modalContent = controlled ? children : content;

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const trapFocus = (e: KeyboardEvent) => {
      const container = contentRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === container)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") trapFocus(e);
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeModal]);

  // Kept apart from the effect above: closeModal can change on every render,
  // and re-running this would pull focus out of a field while the user types.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    contentRef.current?.focus();

    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modalWrapper}>
          <Overlay onClick={closeModal} />

          <motion.div
            ref={contentRef}
            className={styles.modalContent}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className={styles.closeWrapper}>
              <CloseButton onClick={closeModal} />
            </div>

            <div className={styles.innerContent}>{modalContent}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,

    document.body,
  );
};
