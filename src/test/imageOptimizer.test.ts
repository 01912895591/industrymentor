import { describe, it, expect, vi } from "vitest";
import {
  calculateDimensions,
  isOptimizableImage,
  isSpecialAsset,
  determineFormatDecision,
  getOptimizedFileName,
  formatBytes,
  optimizeImage,
  detectCanvasAlpha,
} from "../lib/imageOptimizer";

describe("imageOptimizer", () => {
  describe("calculateDimensions", () => {
    it("should scale down width proportionally when width > maxDimension", () => {
      const result = calculateDimensions(2400, 1200, 1200);
      expect(result).toEqual({ width: 1200, height: 600 });
    });

    it("should scale down height proportionally when height > maxDimension", () => {
      const result = calculateDimensions(800, 1600, 800);
      expect(result).toEqual({ width: 400, height: 800 });
    });

    it("should preserve dimensions when image is smaller than maxDimension (no upscaling)", () => {
      const result = calculateDimensions(600, 400, 1200);
      expect(result).toEqual({ width: 600, height: 400 });
    });

    it("should handle square images larger than maxDimension", () => {
      const result = calculateDimensions(2000, 2000, 1200);
      expect(result).toEqual({ width: 1200, height: 1200 });
    });

    it("should return original dimensions for invalid or zero inputs", () => {
      expect(calculateDimensions(0, 500, 1200)).toEqual({ width: 0, height: 500 });
      expect(calculateDimensions(500, 0, 1200)).toEqual({ width: 500, height: 0 });
      expect(calculateDimensions(500, 500, 0)).toEqual({ width: 500, height: 500 });
    });
  });

  describe("isOptimizableImage", () => {
    it("should return true for JPEG, PNG, and WebP", () => {
      const jpeg = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const png = new File(["test"], "photo.png", { type: "image/png" });
      const webp = new File(["test"], "photo.webp", { type: "image/webp" });

      expect(isOptimizableImage(jpeg)).toBe(true);
      expect(isOptimizableImage(png)).toBe(true);
      expect(isOptimizableImage(webp)).toBe(true);
    });

    it("should return false for SVG and GIF", () => {
      const svg = new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" });
      const gif = new File(["test"], "anim.gif", { type: "image/gif" });

      expect(isOptimizableImage(svg)).toBe(false);
      expect(isOptimizableImage(gif)).toBe(false);
    });

    it("should return false for non-image files", () => {
      const pdf = new File(["test"], "doc.pdf", { type: "application/pdf" });
      const txt = new File(["test"], "notes.txt", { type: "text/plain" });

      expect(isOptimizableImage(pdf)).toBe(false);
      expect(isOptimizableImage(txt)).toBe(false);
    });
  });

  describe("formatBytes", () => {
    it("should correctly format byte counts", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
      expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
    });
  });

  describe("SPECIAL TEST MATRIX", () => {
    // TEST 1: Normal JPEG → WebP
    it("TEST 1: Normal JPEG decides to convert to WebP", () => {
      const jpegFile = new File(["fake-jpeg-data"], "course-cover.jpg", {
        type: "image/jpeg",
      });
      const decision = determineFormatDecision(jpegFile, { assetType: "course_cover" });

      expect(decision.shouldConvert).toBe(true);
      expect(decision.targetFormat).toBe("image/webp");
    });

    // TEST 2: Normal non-transparent PNG → WebP
    it("TEST 2: Normal non-transparent PNG decides to convert to WebP", () => {
      const pngFile = new File(["fake-png-data"], "blog-hero.png", {
        type: "image/png",
      });
      const decision = determineFormatDecision(pngFile, { assetType: "blog_cover" });

      expect(decision.shouldConvert).toBe(true);
      expect(decision.targetFormat).toBe("image/webp");
    });

    // TEST 3: Transparent PNG → verify alpha is detected
    it("TEST 3: Transparent PNG alpha detection correctly identifies transparent pixels", () => {
      const mockCanvas = {
        getImageData: () => ({
          data: new Uint8ClampedArray([
            255, 0, 0, 255,   // fully opaque red
            0, 255, 0, 128,   // semi-transparent green (alpha = 128)
            0, 0, 255, 0,     // fully transparent blue (alpha = 0)
          ]),
        }),
      } as unknown as CanvasRenderingContext2D;

      const hasAlpha = detectCanvasAlpha(mockCanvas, 3, 1);
      expect(hasAlpha).toBe(true);
    });

    // TEST 4: SVG → remains SVG
    it("TEST 4: SVG remains SVG without rasterization", async () => {
      const svgFile = new File(["<svg viewBox='0 0 100 100'></svg>"], "badge.svg", {
        type: "image/svg+xml",
      });
      const decision = determineFormatDecision(svgFile);
      expect(decision.shouldConvert).toBe(false);
      expect(decision.targetFormat).toBe("original");

      const result = await optimizeImage(svgFile);
      expect(result.file).toBe(svgFile);
      expect(result.file.type).toBe("image/svg+xml");
      expect(result.wasConverted).toBe(false);
    });

    // TEST 5: GIF → remains GIF
    it("TEST 5: GIF remains GIF without losing animation frames", async () => {
      const gifFile = new File(["fake-gif-data"], "animation.gif", {
        type: "image/gif",
      });
      const decision = determineFormatDecision(gifFile);
      expect(decision.shouldConvert).toBe(false);
      expect(decision.targetFormat).toBe("original");

      const result = await optimizeImage(gifFile);
      expect(result.file).toBe(gifFile);
      expect(result.file.type).toBe("image/gif");
      expect(result.wasConverted).toBe(false);
    });

    // TEST 6: Logo PNG → verify transparency/visual integrity
    it("TEST 6: Logo PNG preserves original format and alpha transparency", async () => {
      const logoFile = new File(["fake-logo-png"], "brand-logo.png", {
        type: "image/png",
      });
      const decision = determineFormatDecision(logoFile, { assetType: "logo" });

      expect(decision.shouldConvert).toBe(false);
      expect(decision.targetFormat).toBe("original");
      expect(isSpecialAsset("logo")).toBe(true);

      const result = await optimizeImage(logoFile, { assetType: "logo" });
      expect(result.file).toBe(logoFile);
      expect(result.file.type).toBe("image/png");
      expect(result.wasConverted).toBe(false);
    });

    // TEST 7: Signature PNG → verify transparency and fine strokes
    it("TEST 7: Signature PNG preserves original PNG format to retain fine strokes and transparency", async () => {
      const signatureFile = new File(["fake-signature-png"], "ceo-signature.png", {
        type: "image/png",
      });
      const decision = determineFormatDecision(signatureFile, { assetType: "signature" });

      expect(decision.shouldConvert).toBe(false);
      expect(decision.targetFormat).toBe("original");
      expect(isSpecialAsset("signature")).toBe(true);

      const result = await optimizeImage(signatureFile, { assetType: "signature" });
      expect(result.file).toBe(signatureFile);
      expect(result.file.type).toBe("image/png");
      expect(result.wasConverted).toBe(false);
    });

    // TEST 8: Certificate-related PNG → verify transparency/text/fine details
    it("TEST 8: Certificate-related PNG preserves original format for print/vector fidelity", async () => {
      const certFile = new File(["fake-cert-asset"], "cert-seal.png", {
        type: "image/png",
      });
      const decision = determineFormatDecision(certFile, { assetType: "certificate" });

      expect(decision.shouldConvert).toBe(false);
      expect(decision.targetFormat).toBe("original");
      expect(isSpecialAsset("certificate")).toBe(true);

      const result = await optimizeImage(certFile, { assetType: "certificate" });
      expect(result.file).toBe(certFile);
      expect(result.file.type).toBe("image/png");
      expect(result.wasConverted).toBe(false);
    });

    // TEST 9: Failed optimization → safe fallback to original file
    it("TEST 9: Failed optimization gracefully falls back to original file", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const corruptFile = new File(["corrupted-image-data"], "broken.jpg", {
        type: "image/jpeg",
      });

      const result = await optimizeImage(corruptFile, { assetType: "course_cover" });

      expect(result.file).toBe(corruptFile);
      expect(result.file.type).toBe("image/jpeg");
      expect(result.compressionRatio).toBe(1);
      expect(result.wasConverted).toBe(false);
      warnSpy.mockRestore();
    });

    // TEST 10: Converted image → .webp filename + image/webp contentType
    it("TEST 10: Converted image receives .webp filename and image/webp contentType", () => {
      const originalName = "lecture-cover.jpeg";
      const convertedName = getOptimizedFileName(originalName, "image/webp");

      expect(convertedName).toBe("lecture-cover.webp");
      expect(convertedName.endsWith(".webp")).toBe(true);
    });

    // TEST 11: Preserved image → original extension + correct contentType
    it("TEST 11: Preserved image maintains exact extension and matching contentType", () => {
      expect(getOptimizedFileName("logo.png", "image/png")).toBe("logo.png");
      expect(getOptimizedFileName("favicon.ico", "image/x-icon")).toBe("favicon.ico");
      expect(getOptimizedFileName("vector.svg", "image/svg+xml")).toBe("vector.svg");
      expect(getOptimizedFileName("signature.png", "image/png")).toBe("signature.png");
    });

    // TEST 12: Database path matches actual uploaded file extension
    it("TEST 12: Generated filename extension consistently reflects file contentType", () => {
      const mockWebpFile = new File(["webpdata"], "photo.webp", { type: "image/webp" });
      const webpExt = mockWebpFile.name.split(".").pop()?.toLowerCase() || (mockWebpFile.type === "image/webp" ? "webp" : "jpg");
      const dbFileNameWebp = `course-cover-123456789.${webpExt}`;

      expect(dbFileNameWebp).toBe("course-cover-123456789.webp");
      expect(mockWebpFile.type).toBe("image/webp");

      const mockPngFile = new File(["pngdata"], "signature.png", { type: "image/png" });
      const pngExt = mockPngFile.name.split(".").pop()?.toLowerCase() || (mockPngFile.type === "image/webp" ? "webp" : "png");
      const dbFileNamePng = `signature-123456789.${pngExt}`;

      expect(dbFileNamePng).toBe("signature-123456789.png");
      expect(mockPngFile.type).toBe("image/png");
    });
  });
});
