import { NextRequest, NextResponse } from "next/server";

import { searchProducts } from "@/db/product";

import { getClientIp, limiter } from "@/common/auth/rate-limit";
import { getLocalizedField } from "@/common/utils/locale";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  try {
    await limiter.check(300, `search:${ip}`);
  } catch {
    return NextResponse.json({ products: [] }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const locale = searchParams.get("locale") ?? "uk";

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  if (q.length > 100) {
    return NextResponse.json({ products: [] }, { status: 400 });
  }

  try {
    const { products } = await searchProducts(q, { page: 1, limit: 6 });

    const result = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: getLocalizedField(p, "name", locale),
      price: p.price,
      discountPrice: p.discountPrice,
      image: p.images[0]?.url ?? null,
      categorySlug: p.category.slug,
    }));

    return NextResponse.json({ products: result });
  } catch {
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
