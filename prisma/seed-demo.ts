import "dotenv/config";

import { insertProduct, updateProductInDb } from "../src/db/product";
import { prisma } from "../src/libs/prisma";

/**
 * Fills the store with demo products, so a fresh deployment does not look empty.
 *
 *   yarn prisma:seed:demo            create the products, or reset them to these values
 *   yarn prisma:seed:demo --remove   delete only the products listed in this file
 *
 * Run `yarn prisma:seed` first: products are attached to the base categories.
 * Photos are from Unsplash (https://unsplash.com/license).
 */

type Group = "men" | "women" | "unisex" | "accessories";

interface DemoColor {
  uk?: string;
  en?: string;
  /** Stock per size. A zero shows the size as unavailable. */
  stock: Record<string, number>;
}

interface DemoProduct {
  slug: string;
  group: Group;
  category: string;
  nameUk: string;
  nameEn: string;
  descriptionUk: string;
  descriptionEn: string;
  compositionUk: string;
  compositionEn: string;
  careUk: string;
  careEn: string;
  price: number;
  discountPrice?: number;
  isFeatured?: boolean;
  photos: string[];
  colors: DemoColor[];
}

const CARE = {
  wool: {
    uk: "Лише суха чистка. Зберігати на широких плічках.",
    en: "Dry clean only. Store on a wide hanger.",
  },
  leather: {
    uk: "Протирати вологою тканиною. Берегти від прямих сонячних променів.",
    en: "Wipe with a damp cloth. Keep out of direct sunlight.",
  },
  cotton: {
    uk: "Прати за 30 °C навиворіт. Не відбілювати.",
    en: "Machine wash inside out at 30 °C. Do not bleach.",
  },
  outerwear: {
    uk: "Прати за 30 °C на делікатному режимі. Не прасувати.",
    en: "Machine wash at 30 °C on a delicate cycle. Do not iron.",
  },
  shoes: {
    uk: "Чистити м'якою щіткою та використовувати засіб для догляду за шкірою.",
    en: "Clean with a soft brush and use a leather conditioner.",
  },
  knit: {
    uk: "Ручне прання за 30 °C. Сушити горизонтально.",
    en: "Hand wash at 30 °C. Dry flat.",
  },
} as const;

const PRODUCTS: DemoProduct[] = [
  // Men
  {
    slug: "bomber-field-olive",
    group: "men",
    category: "men-outerwear",
    nameUk: "Бомбер Field",
    nameEn: "Field Bomber Jacket",
    descriptionUk: "Легкий бомбер прямого крою з манжетами в рубчик. Базова річ на міжсезоння.",
    descriptionEn: "A lightweight straight-cut bomber with ribbed cuffs. A transitional essential.",
    compositionUk: "100% поліамід, підкладка — 100% поліестер",
    compositionEn: "100% polyamide, lining: 100% polyester",
    careUk: CARE.outerwear.uk,
    careEn: CARE.outerwear.en,
    price: 3290,
    photos: ["1629353689974-af4d5c70440f"],
    colors: [{ uk: "Оливковий", en: "Olive", stock: { S: 4, M: 8, L: 6, XL: 3 } }],
  },
  {
    slug: "coat-milano-camel",
    group: "men",
    category: "men-outerwear",
    nameUk: "Вовняне пальто Milano",
    nameEn: "Milano Wool Coat",
    descriptionUk: "Класичне пальто вільного крою з вовни. Тримає форму та не сковує рухів.",
    descriptionEn: "A classic relaxed wool coat that keeps its shape without restricting movement.",
    compositionUk: "70% вовна, 30% поліамід",
    compositionEn: "70% wool, 30% polyamide",
    careUk: CARE.wool.uk,
    careEn: CARE.wool.en,
    price: 6490,
    discountPrice: 5190,
    isFeatured: true,
    photos: ["1619603364937-8d7af41ef206", "1619603364904-c0498317e145"],
    colors: [{ uk: "Карамельний", en: "Camel", stock: { S: 2, M: 5, L: 4, XL: 0 } }],
  },
  {
    slug: "leather-jacket-ranch-brown",
    group: "men",
    category: "men-outerwear",
    nameUk: "Шкіряна куртка Ranch",
    nameEn: "Ranch Leather Jacket",
    descriptionUk: "Куртка з натуральної шкіри з м'яким блиском. З часом виглядає лише краще.",
    descriptionEn: "A genuine leather jacket with a soft sheen that only improves with age.",
    compositionUk: "100% натуральна шкіра, підкладка — 100% віскоза",
    compositionEn: "100% genuine leather, lining: 100% viscose",
    careUk: CARE.leather.uk,
    careEn: CARE.leather.en,
    price: 7990,
    isFeatured: true,
    photos: [
      "1700993443419-b6f067e734e4",
      "1700993443948-0691df37d507",
      "1700993443774-306a87b16ae1",
    ],
    colors: [{ uk: "Коричневий", en: "Brown", stock: { M: 3, L: 4, XL: 2 } }],
  },
  {
    slug: "biker-jacket-urban-black",
    group: "men",
    category: "men-outerwear",
    nameUk: "Косуха Urban",
    nameEn: "Urban Biker Jacket",
    descriptionUk: "Чорна косуха з металевою фурнітурою для міських образів.",
    descriptionEn: "A black biker jacket with metal hardware, made for city looks.",
    compositionUk: "100% натуральна шкіра, підкладка — 100% поліестер",
    compositionEn: "100% genuine leather, lining: 100% polyester",
    careUk: CARE.leather.uk,
    careEn: CARE.leather.en,
    price: 8490,
    photos: ["1602525582399-7ef5f604ff7e"],
    colors: [{ uk: "Чорний", en: "Black", stock: { S: 2, M: 3, L: 3 } }],
  },
  {
    slug: "chinos-essential-sand",
    group: "men",
    category: "men-pants",
    nameUk: "Чіноси Essential",
    nameEn: "Essential Chinos",
    descriptionUk: "Зручні чіноси звуженого крою з щільної бавовни на кожен день.",
    descriptionEn: "Comfortable tapered chinos in dense cotton for everyday wear.",
    compositionUk: "98% бавовна, 2% еластан",
    compositionEn: "98% cotton, 2% elastane",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 2190,
    photos: ["1473966968600-fa801b869a1a"],
    colors: [{ uk: "Пісочний", en: "Sand", stock: { "30": 5, "32": 9, "34": 7, "36": 3 } }],
  },
  {
    slug: "jeans-straight-classic-blue",
    group: "men",
    category: "men-pants",
    nameUk: "Джинси Straight Classic",
    nameEn: "Straight Classic Jeans",
    descriptionUk: "Прямі джинси з щільного деніму без стрейчу. Класика, що не виходить з моди.",
    descriptionEn: "Straight jeans in rigid denim. A classic that never goes out of style.",
    compositionUk: "100% бавовна",
    compositionEn: "100% cotton",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 2490,
    discountPrice: 1990,
    photos: ["1602293589930-45aad59ba3ab"],
    colors: [{ uk: "Синій", en: "Blue", stock: { "30": 4, "32": 6, "34": 0, "36": 2 } }],
  },
  {
    slug: "boots-ridge-dark-brown",
    group: "men",
    category: "men-shoes",
    nameUk: "Черевики Ridge",
    nameEn: "Ridge Boots",
    descriptionUk: "Шкіряні черевики на шнурівці з протекторною підошвою для міста та подорожей.",
    descriptionEn: "Lace-up leather boots with a lug sole for the city and for travel.",
    compositionUk: "Верх — натуральна шкіра, підошва — гума",
    compositionEn: "Upper: genuine leather, sole: rubber",
    careUk: CARE.shoes.uk,
    careEn: CARE.shoes.en,
    price: 4490,
    isFeatured: true,
    photos: ["1608256246200-53e635b5b65f"],
    colors: [
      { uk: "Темно-коричневий", en: "Dark brown", stock: { "41": 3, "42": 5, "43": 6, "44": 2 } },
    ],
  },
  {
    slug: "work-boots-trail-caramel",
    group: "men",
    category: "men-shoes",
    nameUk: "Черевики Trail",
    nameEn: "Trail Work Boots",
    descriptionUk: "Міцні черевики зі шкіри нубук із вологозахисним просоченням.",
    descriptionEn: "Durable nubuck leather boots with a water-repellent finish.",
    compositionUk: "Верх — нубук, підошва — гума",
    compositionEn: "Upper: nubuck, sole: rubber",
    careUk: CARE.shoes.uk,
    careEn: CARE.shoes.en,
    price: 4790,
    discountPrice: 3890,
    photos: ["1706587161985-abec97ad6af8"],
    colors: [
      { uk: "Карамельний", en: "Caramel", stock: { "40": 2, "41": 4, "42": 4, "43": 3, "45": 1 } },
    ],
  },

  // Women
  {
    slug: "belted-coat-noir-black",
    group: "women",
    category: "women-outerwear",
    nameUk: "Пальто з поясом Noir",
    nameEn: "Noir Belted Coat",
    descriptionUk: "Елегантне чорне пальто з поясом, що підкреслює талію.",
    descriptionEn: "An elegant black coat with a belt that defines the waist.",
    compositionUk: "60% вовна, 40% поліестер",
    compositionEn: "60% wool, 40% polyester",
    careUk: CARE.wool.uk,
    careEn: CARE.wool.en,
    price: 5490,
    photos: ["1760551937537-a29dbbfab30b"],
    colors: [{ uk: "Чорний", en: "Black", stock: { XS: 3, S: 5, M: 4, L: 2 } }],
  },
  {
    slug: "trench-paris-beige",
    group: "women",
    category: "women-outerwear",
    nameUk: "Тренч Paris",
    nameEn: "Paris Trench Coat",
    descriptionUk: "Двобортний тренч із вологозахисної бавовни — головна річ весняного гардероба.",
    descriptionEn: "A double-breasted water-repellent cotton trench, the key piece for spring.",
    compositionUk: "100% бавовна",
    compositionEn: "100% cotton",
    careUk: CARE.outerwear.uk,
    careEn: CARE.outerwear.en,
    price: 5990,
    isFeatured: true,
    photos: ["1792873494576-83ddde24df72"],
    colors: [{ uk: "Бежевий", en: "Beige", stock: { XS: 2, S: 6, M: 5, L: 3 } }],
  },
  {
    slug: "puffer-cloud-white",
    group: "women",
    category: "women-outerwear",
    nameUk: "Пуховик Cloud",
    nameEn: "Cloud Puffer Jacket",
    descriptionUk: "Об'ємний укорочений пуховик, легкий і дуже теплий.",
    descriptionEn: "A voluminous cropped puffer jacket, light and very warm.",
    compositionUk: "Верх — 100% поліамід, наповнювач — 80% пух, 20% перо",
    compositionEn: "Shell: 100% polyamide, filling: 80% down, 20% feather",
    careUk: CARE.outerwear.uk,
    careEn: CARE.outerwear.en,
    price: 4890,
    discountPrice: 3990,
    isFeatured: true,
    photos: ["1678884399113-0a2b079a31f5"],
    colors: [{ uk: "Білий", en: "White", stock: { XS: 4, S: 7, M: 5, L: 0 } }],
  },
  {
    slug: "flared-jeans-seventies-blue",
    group: "women",
    category: "women-pants",
    nameUk: "Джинси кльош Seventies",
    nameEn: "Seventies Flared Jeans",
    descriptionUk: "Джинси кльош із високою посадкою, що візуально подовжують ноги.",
    descriptionEn: "High-rise flared jeans that visually lengthen the legs.",
    compositionUk: "99% бавовна, 1% еластан",
    compositionEn: "99% cotton, 1% elastane",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 2390,
    photos: ["1580651214613-f4692d6d138f"],
    colors: [{ uk: "Синій", en: "Blue", stock: { XS: 3, S: 6, M: 6, L: 2 } }],
  },
  {
    slug: "wide-leg-trousers-sage",
    group: "women",
    category: "women-pants",
    nameUk: "Широкі штани Sage",
    nameEn: "Sage Wide-Leg Trousers",
    descriptionUk: "Струмливі штани з високою посадкою та стрілками.",
    descriptionEn: "Flowing high-waisted trousers with pressed creases.",
    compositionUk: "65% поліестер, 35% віскоза",
    compositionEn: "65% polyester, 35% viscose",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 2590,
    photos: ["1687825515654-23620796760c"],
    colors: [{ uk: "Шавлієвий", en: "Sage", stock: { XS: 2, S: 4, M: 5, L: 3 } }],
  },
  {
    slug: "striped-trousers-riviera",
    group: "women",
    category: "women-pants",
    nameUk: "Штани в смужку Riviera",
    nameEn: "Riviera Striped Trousers",
    descriptionUk: "Легкі літні штани у вертикальну смужку з високою посадкою.",
    descriptionEn: "Light high-waisted summer trousers with vertical stripes.",
    compositionUk: "100% льон",
    compositionEn: "100% linen",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 2290,
    discountPrice: 1790,
    photos: ["1789110854083-e4752bded644"],
    colors: [{ uk: "Білий у смужку", en: "White striped", stock: { XS: 0, S: 3, M: 4, L: 1 } }],
  },
  {
    slug: "ankle-boots-sienna-caramel",
    group: "women",
    category: "women-shoes",
    nameUk: "Ботильйони Sienna",
    nameEn: "Sienna Ankle Boots",
    descriptionUk: "Замшеві ботильйони на стійких підборах, зручні на весь день.",
    descriptionEn: "Suede ankle boots on a stable heel, comfortable all day long.",
    compositionUk: "Верх — натуральна замша, підошва — гума",
    compositionEn: "Upper: genuine suede, sole: rubber",
    careUk: CARE.shoes.uk,
    careEn: CARE.shoes.en,
    price: 3990,
    isFeatured: true,
    photos: ["1605733160314-4fc7dac4bb16"],
    colors: [
      { uk: "Карамельний", en: "Caramel", stock: { "36": 2, "37": 5, "38": 6, "39": 4, "40": 1 } },
    ],
  },
  {
    slug: "chelsea-boots-onyx-black",
    group: "women",
    category: "women-shoes",
    nameUk: "Челсі Onyx",
    nameEn: "Onyx Chelsea Boots",
    descriptionUk: "Лаконічні шкіряні челсі з еластичними вставками.",
    descriptionEn: "Minimal leather Chelsea boots with elastic side panels.",
    compositionUk: "Верх — натуральна шкіра, підошва — гума",
    compositionEn: "Upper: genuine leather, sole: rubber",
    careUk: CARE.shoes.uk,
    careEn: CARE.shoes.en,
    price: 4290,
    discountPrice: 3490,
    photos: ["1605732440685-d0654d81aa30", "1605733513549-de9b150bd70d"],
    colors: [{ uk: "Чорний", en: "Black", stock: { "36": 3, "37": 4, "38": 5, "39": 3 } }],
  },

  // Unisex. The hoodie comes in two colors, each with its own stock.
  {
    slug: "hoodie-essential",
    group: "unisex",
    category: "unisex",
    nameUk: "Худі Essential",
    nameEn: "Essential Hoodie",
    descriptionUk: "Щільне оверсайз-худі з начосом. Доступне у двох кольорах.",
    descriptionEn: "A heavyweight oversized fleece hoodie. Available in two colors.",
    compositionUk: "80% бавовна, 20% поліестер",
    compositionEn: "80% cotton, 20% polyester",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 2190,
    isFeatured: true,
    photos: ["1578768079052-aa76e52ff62e", "1564557287817-3785e38ec1f5"],
    colors: [
      { uk: "Коричневий", en: "Brown", stock: { S: 5, M: 8, L: 6, XL: 0 } },
      { uk: "Сірий", en: "Grey", stock: { S: 0, M: 4, L: 7, XL: 3 } },
    ],
  },
  {
    slug: "parka-north-brown",
    group: "unisex",
    category: "unisex-outerwear",
    nameUk: "Парка North",
    nameEn: "North Parka",
    descriptionUk: "Тепла парка з капюшоном та вітрозахисною тканиною для холодної зими.",
    descriptionEn: "A warm hooded parka in windproof fabric, made for cold winters.",
    compositionUk: "Верх — 100% поліамід, наповнювач — 100% поліестер",
    compositionEn: "Shell: 100% polyamide, filling: 100% polyester",
    careUk: CARE.outerwear.uk,
    careEn: CARE.outerwear.en,
    price: 5490,
    photos: ["1555940451-6f411261b542"],
    colors: [{ uk: "Темно-коричневий", en: "Dark brown", stock: { S: 2, M: 5, L: 5, XL: 2 } }],
  },
  {
    slug: "cargo-pants-joggers-lavender",
    group: "unisex",
    category: "unisex-pants",
    nameUk: "Карго-джогери Lavender",
    nameEn: "Lavender Cargo Joggers",
    descriptionUk: "Вільні карго з кишенями та манжетами внизу. Легкі й дуже зручні.",
    descriptionEn:
      "Relaxed cargo joggers with pockets and cuffed hems. Light and very comfortable.",
    compositionUk: "100% бавовна",
    compositionEn: "100% cotton",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 2390,
    discountPrice: 1890,
    photos: ["1789110520465-efc5ff05c95e"],
    colors: [{ uk: "Лавандовий", en: "Lavender", stock: { XS: 2, S: 4, M: 5, L: 3 } }],
  },
  {
    slug: "sneakers-daily-white",
    group: "unisex",
    category: "unisex-shoes",
    nameUk: "Кеди Daily",
    nameEn: "Daily Sneakers",
    descriptionUk: "Легкі білі кеди, що пасують до всього в гардеробі.",
    descriptionEn: "Light white sneakers that go with everything in your wardrobe.",
    compositionUk: "Верх — текстиль, підошва — гума",
    compositionEn: "Upper: textile, sole: rubber",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 2690,
    photos: ["1689357642277-65228ee23680"],
    colors: [
      {
        uk: "Білий",
        en: "White",
        stock: { "37": 3, "38": 5, "39": 5, "40": 6, "41": 4, "42": 4, "43": 2 },
      },
    ],
  },

  // Accessories
  {
    slug: "belt-heritage-brown",
    group: "accessories",
    category: "accessories",
    nameUk: "Ремінь Heritage",
    nameEn: "Heritage Belt",
    descriptionUk: "Класичний ремінь із натуральної шкіри з металевою пряжкою.",
    descriptionEn: "A classic genuine leather belt with a metal buckle.",
    compositionUk: "100% натуральна шкіра",
    compositionEn: "100% genuine leather",
    careUk: CARE.leather.uk,
    careEn: CARE.leather.en,
    price: 1190,
    photos: ["1664286074176-5206ee5dc878"],
    colors: [{ uk: "Коричневий", en: "Brown", stock: { "90": 4, "100": 6, "110": 3 } }],
  },
  {
    slug: "beanie-rib",
    group: "accessories",
    category: "accessories",
    nameUk: "Шапка Rib",
    nameEn: "Rib Beanie",
    descriptionUk: "М'яка шапка великого рубчика в двох кольорах. Один розмір.",
    descriptionEn: "A soft chunky-rib beanie in two colors. One size.",
    compositionUk: "50% вовна, 50% акрил",
    compositionEn: "50% wool, 50% acrylic",
    careUk: CARE.knit.uk,
    careEn: CARE.knit.en,
    price: 590,
    isFeatured: true,
    photos: ["1630691650107-53dd500d2907", "1618354691792-d1d42acfd860"],
    colors: [
      { uk: "Гірчичний", en: "Mustard", stock: { "One Size": 12 } },
      { uk: "Чорний", en: "Black", stock: { "One Size": 9 } },
    ],
  },
  {
    slug: "shopper-kraft-beige",
    group: "accessories",
    category: "accessories",
    nameUk: "Шопер Kraft",
    nameEn: "Kraft Shopper",
    descriptionUk: "Місткий шопер із щільної тканини на кожен день.",
    descriptionEn: "A roomy shopper in dense fabric for every day.",
    compositionUk: "100% бавовна",
    compositionEn: "100% cotton",
    careUk: CARE.cotton.uk,
    careEn: CARE.cotton.en,
    price: 490,
    photos: ["1544816155-12df9643f363"],
    colors: [{ uk: "Бежевий", en: "Beige", stock: { "One Size": 20 } }],
  },
  {
    slug: "sunglasses-noir-black",
    group: "accessories",
    category: "accessories",
    nameUk: "Сонцезахисні окуляри Noir",
    nameEn: "Noir Sunglasses",
    descriptionUk: "Окуляри в класичній оправі з захистом UV400.",
    descriptionEn: "Sunglasses in a classic frame with UV400 protection.",
    compositionUk: "Оправа — ацетат, лінзи — полікарбонат",
    compositionEn: "Frame: acetate, lenses: polycarbonate",
    careUk: "Протирати м'якою серветкою та зберігати у футлярі.",
    careEn: "Wipe with a soft cloth and store in the case.",
    price: 1290,
    photos: ["1584036553516-bf83210aa16c"],
    colors: [{ uk: "Чорний", en: "Black", stock: { "One Size": 8 } }],
  },
  {
    // Sold out on purpose, to show how the store presents unavailable products.
    slug: "scarf-alpine-cream",
    group: "accessories",
    category: "accessories",
    nameUk: "Шарф Alpine",
    nameEn: "Alpine Scarf",
    descriptionUk: "Теплий в'язаний шарф із м'якої вовни.",
    descriptionEn: "A warm knitted scarf in soft wool.",
    compositionUk: "100% вовна",
    compositionEn: "100% wool",
    careUk: CARE.knit.uk,
    careEn: CARE.knit.en,
    price: 990,
    photos: ["1491245257527-395e9c480145"],
    colors: [{ uk: "Кремовий", en: "Cream", stock: { "One Size": 0 } }],
  },
];

const MAX_RELATED_PRODUCTS = 4;

const photoUrl = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1000&h=1333&fit=crop&q=80&auto=format`;

function toSku(slug: string, color: DemoColor, size: string) {
  return [slug, color.en, size].filter(Boolean).join("-").replace(/\s+/g, "-").toUpperCase();
}

async function seed() {
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryIds = new Map(categories.map((c) => [c.slug, c.id]));
  const productIds = new Map<string, string>();

  for (const [index, product] of PRODUCTS.entries()) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) {
      throw new Error(`Category "${product.category}" not found. Run "yarn prisma:seed" first.`);
    }

    const data = {
      nameUk: product.nameUk,
      nameEn: product.nameEn,
      slug: product.slug,
      descriptionUk: product.descriptionUk,
      descriptionEn: product.descriptionEn,
      compositionUk: product.compositionUk,
      compositionEn: product.compositionEn,
      careInstructionsUk: product.careUk,
      careInstructionsEn: product.careEn,
      price: product.price,
      discountPrice: product.discountPrice ?? null,
      status: "PUBLISHED" as const,
      categoryId,
      isFeatured: product.isFeatured ?? false,
      images: product.photos.map((id, order) => ({
        url: photoUrl(id),
        isPrimary: order === 0,
        order,
      })),
      variants: product.colors.flatMap((color) =>
        Object.entries(color.stock).map(([size, stock]) => ({
          size,
          colorUk: color.uk,
          colorEn: color.en,
          sku: toSku(product.slug, color, size),
          stock,
        })),
      ),
    };

    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });

    const { id } = existing
      ? await updateProductInDb(existing.id, data)
      : await insertProduct(data);

    // Spread the dates, so "New arrivals" has a stable order instead of one identical timestamp.
    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: null,
        publishedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      },
    });

    productIds.set(product.slug, id);
    console.log(`${existing ? "Updated" : "Created"}: ${product.nameEn}`);
  }

  for (const product of PRODUCTS) {
    const related = PRODUCTS.filter((p) => p.group === product.group && p.slug !== product.slug)
      .slice(0, MAX_RELATED_PRODUCTS)
      .map((p) => ({ id: productIds.get(p.slug) as string }));

    await prisma.product.update({
      where: { id: productIds.get(product.slug) },
      data: { relatedProducts: { set: related } },
    });
  }

  console.log(`Done: ${PRODUCTS.length} demo products.`);
}

async function remove() {
  const { count } = await prisma.product.deleteMany({
    where: { slug: { in: PRODUCTS.map((p) => p.slug) } },
  });

  console.log(`Removed ${count} demo products.`);
}

(process.argv.includes("--remove") ? remove() : seed())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
