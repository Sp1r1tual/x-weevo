/**
 * Next.js masks the message of errors thrown from Server Actions in production,
 * so anything the user should read has to be returned as a value instead.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error?: string };

/** An error whose message is already safe and localized for the user. */
export class ActionError extends Error {}

export type DomainErrorCode =
  | "cartEmpty"
  | "cartChanged"
  | "phoneRequired"
  | "addressRequired"
  | "productNotFound"
  | "productUnavailable"
  | "sizeRequired"
  | "outOfStock"
  | "stockLimit"
  | "quantityLimit"
  | "orderChanged"
  | "orderTransitionInvalid";

/** A business rule violation from the data layer, translated in `runAction`. */
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    readonly params: { nameUk?: string; nameEn?: string; stock?: number } = {},
  ) {
    super(code);
    this.name = "DomainError";
  }
}

export function unwrapActionResult<T>(result: ActionResult<T>, fallbackMessage: string): T {
  if (!result.ok) {
    throw new Error(result.error ?? fallbackMessage);
  }
  return result.data;
}
