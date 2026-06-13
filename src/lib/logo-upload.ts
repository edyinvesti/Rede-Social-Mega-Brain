/**
 * Max logo size. The data URL is persisted inside the brand profile in
 * localStorage (~5MB total budget), so we keep the source image small to
 * avoid silently exceeding the quota.
 */
export const MAX_LOGO_BYTES = 1_000_000; // 1 MB

export class LogoTooLargeError extends Error {
  constructor() {
    super("Logo muito grande. Envie uma imagem de até 1 MB.");
    this.name = "LogoTooLargeError";
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_LOGO_BYTES) {
    return Promise.reject(new LogoTooLargeError());
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
