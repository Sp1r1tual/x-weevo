import { ActionError } from "@/common/utils/action-result";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface FileValidationMessages {
  imageSizeMax?: string;
  imageTypeInvalid?: string;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const VALID_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
};

function toAscii(bytes: Uint8Array) {
  return String.fromCharCode(...bytes);
}

function hasValidSignature(type: string, bytes: Uint8Array) {
  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return toAscii(bytes.subarray(1, 4)) === "PNG" && bytes[0] === 0x89;
    case "image/webp":
      return toAscii(bytes.subarray(0, 4)) === "RIFF" && toAscii(bytes.subarray(8, 12)) === "WEBP";
    case "image/avif":
      return (
        toAscii(bytes.subarray(4, 8)) === "ftyp" &&
        ["avif", "avis"].includes(toAscii(bytes.subarray(8, 12)))
      );
    default:
      return false;
  }
}

export async function validateImageFile(file: File, messages?: FileValidationMessages) {
  if (file.size > MAX_FILE_SIZE) {
    throw new ActionError(messages?.imageSizeMax || "File size must be less than 5MB");
  }

  const invalidType = messages?.imageTypeInvalid || "Only JPG, PNG, WEBP, and AVIF are allowed";

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ActionError(invalidType);
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !VALID_EXTENSIONS[file.type]?.includes(extension)) {
    throw new ActionError(invalidType);
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasValidSignature(file.type, bytes)) {
    throw new ActionError(invalidType);
  }
}
