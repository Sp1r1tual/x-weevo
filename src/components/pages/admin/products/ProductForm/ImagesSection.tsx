"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayMove,
  type UseFieldArrayRemove,
  useFormContext,
} from "react-hook-form";

import { uploadProductImage } from "@/actions/upload.actions";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { ImageIcon, Plus } from "lucide-react";

import { ConfirmChoiceModal } from "@/components/ui/Modal/ConfirmChoiceModal";

import { SortableImageCard } from "./SortableImageCard";

import { unwrapActionResult } from "@/common/utils/action-result";
import { convertToWebP } from "@/common/utils/image";
import { type ProductFormData } from "@/common/validation/product/product.schema";

import styles from "./ImagesSection.module.css";

export interface ImagesSectionHandle {
  uploadPendingFiles: () => Promise<void>;
}

interface PendingEntry {
  fieldId: string | null;
  file: File;
  previewUrl: string;
}

interface ImagesSectionProps {
  imageFields: FieldArrayWithId<ProductFormData, "images", "id">[];
  appendImage: UseFieldArrayAppend<ProductFormData, "images">;
  removeImage: UseFieldArrayRemove;
  moveImage: UseFieldArrayMove;
  maxImages?: number;
  ref?: React.Ref<ImagesSectionHandle>;
}

const stepThrottleModifier: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: Math.round(transform.x / 4) * 4,
    y: Math.round(transform.y / 4) * 4,
  };
};

export function ImagesSection({
  imageFields,
  appendImage,
  removeImage,
  moveImage,
  maxImages = 10,
  ref,
}: ImagesSectionProps) {
  const t = useTranslations("Admin.products.form");
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormData>();

  const [pending, setPending] = useState<PendingEntry[]>([]);
  const multiInputRef = useRef<HTMLInputElement>(null);
  const [imageToDelete, setImageToDelete] = useState<{ index: number; fieldId: string } | null>(
    null,
  );

  const [isFileDragActive, setIsFileDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types.includes("Files")) {
      setIsFileDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragActive(false);
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const remaining = maxImages - imageFields.length;

      const convertedFiles = await Promise.all(
        files.map(async (f) => {
          if (f.type.startsWith("image/") && f.type !== "image/webp") {
            try {
              return await convertToWebP(f, 0.85);
            } catch (err) {
              console.error("Failed to convert image to WebP", err);
              return f;
            }
          }
          return f;
        }),
      );

      const pendingFingerprints = new Set(
        pending.map((p) => `${p.file.name}|${p.file.size}|${p.file.lastModified}`),
      );

      const toAdd = convertedFiles
        .filter((f) => f.type.startsWith("image/"))
        .filter((f) => {
          const fp = `${f.name}|${f.size}|${f.lastModified}`;
          return !pendingFingerprints.has(fp);
        })
        .slice(0, remaining);

      if (!toAdd.length) return;

      const newEntries: PendingEntry[] = toAdd.map((file) => ({
        fieldId: null,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      toAdd.forEach((_, i) => {
        appendImage({
          url: "__pending__",
          altText: "",
          isPrimary: imageFields.length + i === 0,
          order: imageFields.length + i,
        });
      });

      setPending((prev) => [...prev, ...newEntries]);
    },
    [appendImage, imageFields.length, maxImages, pending],
  );

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    addFiles(files);
    if (e.target) e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFileDragActive(false);

      if (e.dataTransfer?.files?.length) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    },
    [addFiles],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const unresolved = pending.filter((p) => p.fieldId === null);
    if (!unresolved.length) return;

    const resolvedIds = new Set(pending.filter((p) => p.fieldId !== null).map((p) => p.fieldId));
    const freeFields = imageFields.filter((f) => !resolvedIds.has(f.id));

    if (freeFields.length < unresolved.length) return;

    setTimeout(() => {
      setPending((prev) => {
        let freeIdx = 0;
        return prev.map((p) => {
          if (p.fieldId !== null) return p;
          return { ...p, fieldId: freeFields[freeIdx++].id };
        });
      });
    }, 0);
  }, [imageFields, pending]);

  const getPendingForField = useCallback(
    (fieldId: string) => pending.find((p) => p.fieldId === fieldId),
    [pending],
  );

  const removePendingForField = (fieldId: string) => {
    setPending((prev) => {
      const entry = prev.find((p) => p.fieldId === fieldId);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((p) => p.fieldId !== fieldId);
    });
  };

  useImperativeHandle(ref, () => ({
    uploadPendingFiles: async () => {
      for (const entry of pending) {
        if (!entry.fieldId) continue;
        const formData = new FormData();
        formData.append("file", entry.file);
        const url = unwrapActionResult(await uploadProductImage(formData), t("messages.error"));

        const idx = imageFields.findIndex((f) => f.id === entry.fieldId);
        if (idx !== -1) {
          setValue(`images.${idx}.url`, url, { shouldValidate: true });
        }
      }
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPending([]);
    },
  }));

  const handleRemove = useCallback((index: number, fieldId: string) => {
    setImageToDelete({ index, fieldId });
  }, []);

  const confirmDelete = () => {
    if (imageToDelete) {
      removePendingForField(imageToDelete.fieldId);
      removeImage(imageToDelete.index);
      setImageToDelete(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = imageFields.findIndex((f) => f.id === active.id);
      const newIndex = imageFields.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setPending((prev) => {
          const arr = [...prev];
          const fi = arr.findIndex((p) => p.fieldId === active.id);
          const ti = arr.findIndex((p) => p.fieldId === over.id);
          if (fi !== -1 && ti !== -1) {
            const [moved] = arr.splice(fi, 1);
            arr.splice(ti, 0, moved);
          }
          return arr;
        });

        moveImage(oldIndex, newIndex);
      }
    }
  };

  return (
    <section
      className={`${styles.section} ${isFileDragActive ? styles.dragActive : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{t("sections.images")}</h2>
          {imageFields.length > 0 && <p className={styles.sectionHint}>{t("hints.imagesOrder")}</p>}
        </div>
        <div className={styles.headerActions}>
          <input
            ref={multiInputRef}
            type="file"
            accept="image/*"
            multiple
            className={styles.hiddenFileInput}
            id="multi-image-upload"
            onChange={handleFilePick}
            disabled={imageFields.length >= maxImages}
          />
          <label
            htmlFor="multi-image-upload"
            className={`${styles.addBtn} ${imageFields.length >= maxImages ? styles.addBtnDisabled : ""}`}
            title={imageFields.length >= maxImages ? `Max ${maxImages} images` : undefined}
          >
            <Plus size={15} /> {t("buttons.addImage")}
            {imageFields.length > 0 && (
              <span className={styles.imageCount}>
                {imageFields.length}/{maxImages}
              </span>
            )}
          </label>
        </div>
      </div>

      {imageFields.length === 0 && (
        <label htmlFor="multi-image-upload" className={styles.emptyZone}>
          <ImageIcon size={32} className={styles.emptyIcon} />
          <span className={styles.emptyTitle}>{t("hints.emptyImagesTitle")}</span>
          <span className={styles.emptyHint}>{t("hints.emptyImages")}</span>
        </label>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[stepThrottleModifier]}
      >
        <div className={styles.imageGrid}>
          <SortableContext items={imageFields.map((f) => f.id)} strategy={rectSortingStrategy}>
            {imageFields.map((field, index) => {
              const pend = getPendingForField(field.id);
              const preview =
                pend?.previewUrl || (field.url !== "__pending__" ? field.url : undefined);
              const isPending = field.url === "__pending__" || !!pend;
              const isPrimary = index === 0;

              return (
                <SortableImageCard
                  key={field.id}
                  id={field.id}
                  index={index}
                  preview={preview}
                  isPending={isPending}
                  isPrimary={isPrimary}
                  errorAlt={errors.images?.[index]?.altText?.message}
                  errorUrl={errors.images?.[index]?.url?.message}
                  t={t}
                  register={register}
                  onRemove={handleRemove}
                />
              );
            })}
          </SortableContext>
        </div>
      </DndContext>

      <ConfirmChoiceModal
        isOpen={imageToDelete !== null}
        onClose={() => setImageToDelete(null)}
        onConfirm={confirmDelete}
        title={t("confirmDeleteImage.title")}
        description={t("confirmDeleteImage.description")}
        confirmText={t("confirmDeleteImage.confirm")}
        cancelText={t("confirmDeleteImage.cancel")}
        isDanger
      />
    </section>
  );
}
