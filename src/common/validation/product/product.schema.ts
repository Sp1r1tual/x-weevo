import { z } from "zod";

export interface ProductSchemaMessages {
  imageUrlRequired: string;
  imagesTooMany: string;
  imageDuplicateUrl: string;
  imageAltMax: string;
  variantSizeRequired: string;
  variantStockInvalid: string;
  productNameRequired: string;
  productNameMax: string;
  productSlugRequired: string;
  productSlugRegex: string;
  productPriceRequired: string;
  productPricePositive: string;
  productDiscountPricePositive: string;
  productDiscountPriceTooHigh: string;
  productCategoryRequired: string;
}

export const MAX_IMAGES = 10;

const createProductImageSchema = (msg: ProductSchemaMessages) =>
  z.object({
    url: z.string().min(1, msg.imageUrlRequired),
    altText: z.string().max(125, msg.imageAltMax).optional(),
    isPrimary: z.boolean().default(false),
    order: z.number().default(0),
  });

const createProductVariantSchema = (msg: ProductSchemaMessages) =>
  z.object({
    size: z.string().min(1, msg.variantSizeRequired),
    colorUk: z.string().optional(),
    colorEn: z.string().optional(),
    sku: z.string().optional(),
    stock: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
      z.number().int(msg.variantStockInvalid).min(0, msg.variantStockInvalid),
    ),
  });

export const createProductSchema = (msg: ProductSchemaMessages) =>
  z
    .object({
      nameUk: z.string().min(1, msg.productNameRequired).max(255, msg.productNameMax),
      nameEn: z.string().min(1, msg.productNameRequired).max(255, msg.productNameMax),
      slug: z
        .string()
        .min(1, msg.productSlugRequired)
        .regex(/^[a-z0-9-]+$/, msg.productSlugRegex),
      descriptionUk: z.string().optional(),
      descriptionEn: z.string().optional(),
      compositionUk: z.string().optional(),
      compositionEn: z.string().optional(),
      careInstructionsUk: z.string().optional(),
      careInstructionsEn: z.string().optional(),
      measurementsUk: z.string().optional(),
      measurementsEn: z.string().optional(),
      price: z.preprocess(
        (val) =>
          val === "" || val === null || val === undefined || (typeof val === "number" && isNaN(val))
            ? undefined
            : Number(val),
        z.number({ message: msg.productPriceRequired }).positive(msg.productPricePositive),
      ),
      discountPrice: z
        .preprocess(
          (val) =>
            val === "" ||
            val === null ||
            val === undefined ||
            (typeof val === "number" && isNaN(val))
              ? null
              : Number(val),
          z.number().positive(msg.productDiscountPricePositive).nullable(),
        )
        .optional(),
      status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
      categoryId: z.string().min(1, msg.productCategoryRequired),
      seoTitleUk: z.string().optional(),
      seoTitleEn: z.string().optional(),
      seoDescriptionUk: z.string().optional(),
      seoDescriptionEn: z.string().optional(),
      isFeatured: z.boolean().default(false),
      images: z
        .array(createProductImageSchema(msg))
        .max(MAX_IMAGES, msg.imagesTooMany)
        .refine(
          (imgs) => {
            const realUrls = imgs.map((i) => i.url).filter((u) => u !== "__pending__");
            return realUrls.length === new Set(realUrls).size;
          },
          { message: msg.imageDuplicateUrl },
        )
        .default([]),
      variants: z.array(createProductVariantSchema(msg)).default([]),
    })
    .refine(({ price, discountPrice }) => discountPrice == null || discountPrice < price, {
      message: msg.productDiscountPriceTooHigh,
      path: ["discountPrice"],
    });

export type ProductFormData = z.infer<ReturnType<typeof createProductSchema>>;
