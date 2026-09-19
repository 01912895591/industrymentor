/**
 * Central Image Optimizer Utility
 *
 * Provides safe client-side image resizing and compression using HTML5 Canvas.
 * Prioritizes image integrity, alpha transparency, and format compatibility.
 *
 * Decision Logic:
 * - SVG: Preserve original SVG (vector format).
 * - GIF: Preserve original GIF (animations preserved).
 * - Favicon: Preserve original format (.ico, .png, .svg) for browser compatibility.
 * - Logo: Preserve original format (PNG/SVG) to retain transparency, anti-aliased edges, and crispness.
 * - Signature: Preserve original PNG/SVG to maintain fine line strokes and transparent background.
 * - Certificate Asset: Preserve original format to maintain text/line readability and official output.
 * - Transparent PNG: Preserves alpha channel; keeps PNG if alpha integrity cannot be guaranteed.
 * - General photographic images (Course, Blog, Mentor, Hero, Avatar, Library):
 *     Converts to WebP with maxDimension: 1200px, quality: 0.82, no upscaling, preserving aspect ratio.
 * - Fallback: Gracefully falls back to original File if anything fails.
 */

export type ImageAssetType =
  | "general"
  | "course_cover"
  | "blog_cover"
  | "mentor_photo"
  | "avatar"
  | "hero"
  | "library_cover"
  | "logo"
  | "favicon"
  | "signature"
  | "certificate";

export interface OptimizeImageOptions {
  /**
   * Upload context / asset category.
   * Special assets (logo, favicon, signature, certificate) are preserved without destructive conversion.
   * @default 'general'
   */
  assetType?: ImageAssetType;

  /**
   * Maximum allowed width or height in pixels.
   * Images larger than this value are scaled down proportionally.
   * Images smaller than this value are NOT upscaled.
   * @default 1200
   */
  maxDimension?: number;

  /**
   * Compression quality between 0.0 and 1.0.
   * @default 0.82
   */
  quality?: number;

  /**
   * Target MIME type format for convertible images.
   * @default 'image/webp'
   */
  format?: "image/webp" | "image/jpeg" | "image/png";

  /**
   * If true, keeps original file format and avoids WebP conversion.
   * @default false
   */
  preserveFormat?: boolean;

  /**
   * If true, preserves PNG format when alpha transparency is detected.
   * @default true
   */
  preserveAlphaPng?: boolean;
}

export interface FormatDecision {
  targetFormat: "image/webp" | "image/jpeg" | "image/png" | "original";
  shouldConvert: boolean;
  reason: string;
}

export interface OptimizedImageResult {
  file: File;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  wasConverted: boolean;
  format: string;
}

/**
 * Checks if an asset type is a special category requiring strict format preservation.
 */
export function isSpecialAsset(assetType?: ImageAssetType): boolean {
  if (!assetType) return false;
  return (
    assetType === "logo" ||
    assetType === "favicon" ||
    assetType === "signature" ||
    assetType === "certificate"
  );
}

/**
 * Evaluates the file type and upload context to determine the safe format decision.
 */
export function determineFormatDecision(
  file: File,
  options: OptimizeImageOptions = {}
): FormatDecision {
  const { assetType = "general", preserveFormat = false } = options;
  const mime = file.type?.toLowerCase() || "";
  const name = file.name?.toLowerCase() || "";

  // 1. Vector graphics - SVG
  if (mime === "image/svg+xml" || name.endsWith(".svg")) {
    return {
      targetFormat: "original",
      shouldConvert: false,
      reason: "SVG vector format preserved without rasterization",
    };
  }

  // 2. Animated graphics - GIF
  if (mime === "image/gif" || name.endsWith(".gif")) {
    return {
      targetFormat: "original",
      shouldConvert: false,
      reason: "GIF animation format preserved",
    };
  }

  // 3. Favicon (requires maximum browser compatibility)
  if (assetType === "favicon" || mime === "image/x-icon" || name.endsWith(".ico")) {
    return {
      targetFormat: "original",
      shouldConvert: false,
      reason: "Favicon format preserved for browser and <link rel='icon'> compatibility",
    };
  }

  // 4. Logo (preserves transparency, crisp edges, and brand fidelity)
  if (assetType === "logo") {
    return {
      targetFormat: "original",
      shouldConvert: false,
      reason: "Logo format preserved to maintain transparency and anti-aliasing",
    };
  }

  // 5. Signature (preserves transparent background and fine strokes)
  if (assetType === "signature") {
    return {
      targetFormat: "original",
      shouldConvert: false,
      reason: "Signature format preserved to protect fine handwriting strokes and alpha",
    };
  }

  // 6. Certificate Asset (preserves fine lines, text clarity, and PDF compatibility)
  if (assetType === "certificate") {
    return {
      targetFormat: "original",
      shouldConvert: false,
      reason: "Certificate asset format preserved for print and rendering integrity",
    };
  }

  // 7. Non-image files
  if (!mime.startsWith("image/")) {
    return {
      targetFormat: "original",
      shouldConvert: false,
      reason: "Non-image file bypassed",
    };
  }

  // 8. Explicit preservation request
  if (preserveFormat) {
    return {
      targetFormat: "original",
      shouldConvert: false,
      reason: "Format preservation explicitly requested",
    };
  }

  // 9. Normal photographic / content images (JPEG, PNG, WebP)
  return {
    targetFormat: "image/webp",
    shouldConvert: true,
    reason: "Normal photographic/content image converted to WebP",
  };
}

/**
 * Checks if a file is an image that can be processed by the canvas optimizer.
 */
export function isOptimizableImage(file: File): boolean {
  if (!file || !file.type) return false;
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return false;
  }
  return file.type.startsWith("image/");
}

/**
 * Formats byte size into human-readable string (e.g. 150 KB, 1.2 MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Derives a new filename matching the target format extension.
 * NEVER creates a mismatch between filename extension and actual MIME type.
 */
export function getOptimizedFileName(originalName: string, format: string): string {
  const extensionMap: Record<string, string> = {
    "image/webp": ".webp",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/gif": ".gif",
    "image/x-icon": ".ico",
  };
  const targetExt = extensionMap[format] || ".webp";
  const lastDot = originalName.lastIndexOf(".");
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  return `${baseName}${targetExt}`;
}

/**
 * Samples canvas pixels to detect whether meaningful alpha transparency is present.
 */
export function detectCanvasAlpha(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): boolean {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const len = data.length;
    // Step by 16 bytes for performance on large images
    const step = len > 64000 ? 16 : 4;
    for (let i = 3; i < len; i += step) {
      if (data[i] < 250) {
        return true;
      }
    }
  } catch {
    // If context reading fails (e.g. tainted canvas), fail safely
    return false;
  }
  return false;
}

/**
 * Loads a File into an HTMLImageElement using an object URL.
 */
function loadImage(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image into Image element"));
    };
    img.src = objectUrl;
  });
}

/**
 * Wraps canvas.toBlob in a Promise with error handling.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!canvas.toBlob) {
      resolve(null);
      return;
    }
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      format,
      quality
    );
  });
}

/**
 * Calculates scaled dimensions preserving aspect ratio without upscaling.
 */
export function calculateDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= 0 || height <= 0 || maxDimension <= 0) {
    return { width, height };
  }

  // Do not upscale if both dimensions are within limits
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width >= height) {
    const targetWidth = maxDimension;
    const targetHeight = Math.round((height * maxDimension) / width);
    return { width: targetWidth, height: targetHeight };
  } else {
    const targetHeight = maxDimension;
    const targetWidth = Math.round((width * maxDimension) / height);
    return { width: targetWidth, height: targetHeight };
  }
}

/**
 * Optimizes an image File using HTML5 Canvas with asset-type safety rules.
 *
 * Safety guarantees:
 * - Special assets (logo, favicon, signature, certificate) preserve original format.
 * - SVGs and GIFs are bypassed untouched.
 * - Alpha transparency is never flattened against a color; preserved for WebP/PNG.
 * - General raster images (covers, photos, avatars) are converted to WebP without upscaling.
 * - Output file name and contentType are guaranteed to match the actual format.
 * - On any failure, falls back cleanly to the original File.
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxDimension = 1200,
    quality = 0.82,
    preserveAlphaPng = true,
  } = options;

  const originalSize = file.size;
  const originalFormat = file.type || "application/octet-stream";

  // 1. Evaluate file type and upload context
  const decision = determineFormatDecision(file, options);

  // If preservation is mandated, return original file untouched
  if (!decision.shouldConvert || decision.targetFormat === "original") {
    return {
      file,
      blob: file,
      width: 0,
      height: 0,
      originalSize,
      optimizedSize: originalSize,
      compressionRatio: 1,
      wasConverted: false,
      format: originalFormat,
    };
  }

  let targetMime: "image/webp" | "image/jpeg" | "image/png" = options.format || "image/webp";

  // 2. Process via HTML5 Canvas
  try {
    const { img, objectUrl } = await loadImage(file);

    try {
      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      if (!origWidth || !origHeight) {
        throw new Error("Unable to determine image dimensions");
      }

      // Calculate target dimensions without upscaling
      const { width: targetWidth, height: targetHeight } = calculateDimensions(
        origWidth,
        origHeight,
        maxDimension
      );

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get 2D canvas context");
      }

      // Ensure canvas starts transparent
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // High-quality downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Check for alpha transparency if input is PNG
      if (file.type === "image/png") {
        const hasAlpha = detectCanvasAlpha(ctx, targetWidth, targetHeight);

        // If meaningful transparency is detected and preserveAlphaPng is requested, preserve PNG
        if (hasAlpha && preserveAlphaPng) {
          targetMime = "image/png";
        }
      }

      // If converting to JPEG, fill background with white only for opaque output
      if (targetMime === "image/jpeg") {
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.globalCompositeOperation = "source-over";
      }

      // Convert canvas to Blob
      const blob = await canvasToBlob(canvas, targetMime, quality);

      if (!blob) {
        throw new Error("Canvas to Blob conversion returned null");
      }

      // If optimized blob is larger than original and dimensions were unchanged, keep original
      if (
        blob.size >= originalSize &&
        targetWidth === origWidth &&
        targetHeight === origHeight &&
        file.type === targetMime
      ) {
        return {
          file,
          blob: file,
          width: origWidth,
          height: origHeight,
          originalSize,
          optimizedSize: originalSize,
          compressionRatio: 1,
          wasConverted: false,
          format: originalFormat,
        };
      }

      // Construct new file with exact matching extension and MIME type
      const newName = getOptimizedFileName(file.name, targetMime);
      const optimizedFile = new File([blob], newName, {
        type: targetMime,
        lastModified: Date.now(),
      });

      return {
        file: optimizedFile,
        blob,
        width: targetWidth,
        height: targetHeight,
        originalSize,
        optimizedSize: blob.size,
        compressionRatio:
          originalSize > 0 ? Number((blob.size / originalSize).toFixed(4)) : 1,
        wasConverted: targetMime !== file.type,
        format: targetMime,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    console.warn(
      "[imageOptimizer] Optimization failed, safely falling back to original file:",
      error
    );
    return {
      file,
      blob: file,
      width: 0,
      height: 0,
      originalSize,
      optimizedSize: originalSize,
      compressionRatio: 1,
      wasConverted: false,
      format: originalFormat,
    };
  }
}
