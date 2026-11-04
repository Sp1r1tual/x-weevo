"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSwipe } from "@/hooks/useSwipe";

import { SkeletonImage } from "@/components/ui/SkeletonImage/SkeletonImage";
import { SlideDots } from "@/components/ui/SlideDots/SlideDots";

import styles from "./ImageGallery.module.css";

interface ImageGalleryProps {
  images: { url: string; altText: string | null }[];
}

export const ImageGallery = ({ images }: ImageGalleryProps) => {
  const tA11y = useTranslations("A11y");
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const hasMultiple = images && images.length > 1;

  const goTo = useCallback(
    (index: number) => {
      if (!images || images.length === 0) return;
      setActiveIndex((index + images.length) % images.length);
    },
    [images],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);

  const { handleTouchStart, handleTouchEnd } = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  useEffect(() => {
    const container = thumbnailsRef.current;
    if (!container) return;
    const activeThumb = container.children[activeIndex] as HTMLElement | undefined;
    if (!activeThumb) return;

    const thumbLeft = activeThumb.offsetLeft;
    const thumbWidth = activeThumb.offsetWidth;
    const containerWidth = container.offsetWidth;

    container.scrollTo({
      left: thumbLeft - containerWidth / 2 + thumbWidth / 2,
      behavior: "smooth",
    });
  }, [activeIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext]);

  if (!images || images.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.mainImageWrapper}>
          <div className={styles.placeholder}>No image</div>
        </div>
      </div>
    );
  }

  const handleImageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.arrowBtn}`) || target.closest(`.${styles.dotsContainer}`)) {
      return;
    }
    window.open(images[activeIndex].url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.mainImageWrapper}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleImageClick}
      >
        <SkeletonImage
          src={images[activeIndex].url}
          alt={images[activeIndex].altText || "Product image"}
          fill
          preload
          className={styles.mainImage}
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {hasMultiple && (
          <>
            <button
              className={`${styles.arrowBtn} ${styles.arrowPrev}`}
              onClick={goPrev}
              aria-label={tA11y("previousImage")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className={`${styles.arrowBtn} ${styles.arrowNext}`}
              onClick={goNext}
              aria-label={tA11y("nextImage")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        <div className={styles.dotsContainer}>
          <SlideDots
            count={images.length}
            activeIndex={activeIndex}
            onDotClick={setActiveIndex}
            variant="pill"
            size="s"
          />
        </div>
      </div>

      {hasMultiple && (
        <div className={styles.thumbnails} ref={thumbnailsRef}>
          {images.map((image, index) => (
            <button
              key={index}
              className={`${styles.thumbnailWrapper} ${index === activeIndex ? styles.active : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
            >
              <SkeletonImage
                src={image.url}
                alt={image.altText || `Thumbnail ${index + 1}`}
                fill
                className={styles.thumbnail}
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
