import { getLocale, getTranslations } from "next-intl/server";

import { ActionError, type ActionResult, DomainError } from "./action-result";

/**
 * Runs a Server Action body and converts expected failures into a result the
 * client can display. Unexpected errors are logged and reported without details.
 */
export async function runAction<T>(action: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    if (error instanceof ActionError) {
      return { ok: false, error: error.message };
    }

    if (error instanceof DomainError) {
      const locale = await getLocale();
      const t = await getTranslations({ locale, namespace: "Errors" });
      const { nameUk, nameEn, stock } = error.params;

      return {
        ok: false,
        error: t(error.code, {
          name: (locale === "en" ? nameEn : nameUk) ?? "",
          stock: stock ?? 0,
        }),
      };
    }

    console.error("Server action failed:", error);
    return { ok: false };
  }
}
