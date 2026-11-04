import { BASE_URL } from "@/common/constants/env";

export function getSeoAlternates(locale: string, path: string = "") {
  return {
    canonical: `${BASE_URL}/${locale}${path}`,
    languages: {
      uk: `${BASE_URL}/uk${path}`,
      en: `${BASE_URL}/en${path}`,
      "x-default": `${BASE_URL}/uk${path}`,
    },
  };
}
