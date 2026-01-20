// Navigation store for image folder navigation
// Tracks sibling images in folder and current position

import { readDir } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { env } from "$env/dynamic/public";
import { logger } from "$lib/utils/logger";

// Supported image formats (must match fileService)
const SUPPORTED_FORMATS = [
	"jpg",
	"jpeg",
	"png",
	"gif",
	"webp",
	"bmp",
	"tiff",
	"tif",
	"svg",
	"heic",
	"heif",
	"avif",
	"jxl",
	"ico",
	"icns",
	"psd",
	"tga",
	"exr",
	"hdr",
	"pic",
	"pct",
	"qoi",
	"jng",
	"mng",
];

// === PRELOADING CONFIGURATION ===
// Number of images to preload ahead/behind current image
const PRELOAD_AHEAD = 2; // Preload next 2 images
const PRELOAD_BEHIND = 1; // Preload previous 1 image

const DECODE_SCALE_FACTOR = 1.0;
const DECODE_MAX_WIDTH = 4096;

type PreviewMode = "off" | "aggressive" | "progressive";

function parseEnvInt(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n : fallback;
}

function parseEnvFloat(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const n = Number.parseFloat(value);
	return Number.isFinite(n) ? n : fallback;
}

function normalizePreviewMode(value: string | undefined): PreviewMode {
	const v = (value ?? "off").toLowerCase();
	if (v === "aggressive" || v === "progressive" || v === "off") return v;
	return "off";
}

const previewMode: PreviewMode = normalizePreviewMode(env.PUBLIC_PREVIEW_MODE);
const previewLargeImageBytes = parseEnvInt(env.PUBLIC_PREVIEW_LARGE_IMAGE_BYTES, 12_000_000);
const previewLargeImageMegapixels = parseEnvFloat(env.PUBLIC_PREVIEW_LARGE_IMAGE_MEGAPIXELS, 10);
const previewAggressiveMaxWidth = parseEnvInt(env.PUBLIC_PREVIEW_AGGRESSIVE_MAX_WIDTH, 2048);
const previewProgressiveStage2Width = parseEnvInt(env.PUBLIC_PREVIEW_PROGRESSIVE_STAGE2_WIDTH, 2048);

// Cache for preloaded images (keeps them in memory)
type CachedBitmapEntry = { bitmap: ImageBitmap; resizeWidth: number };
const imageCache = new Map<string, CachedBitmapEntry>();
type InFlightDecodeEntry = { resizeWidth: number; token: number; promise: Promise<void> };
const inFlightDecodes = new Map<string, InFlightDecodeEntry>();
let inFlightTokenCounter = 0;
type ImageDimensions = { width: number; height: number };
const originalDimensionsCache = new Map<string, ImageDimensions>();

function isJpegSOFMarker(marker: number): boolean {
	return (
		marker === 0xc0 ||
		marker === 0xc1 ||
		marker === 0xc2 ||
		marker === 0xc3 ||
		marker === 0xc5 ||
		marker === 0xc6 ||
		marker === 0xc7 ||
		marker === 0xc9 ||
		marker === 0xca ||
		marker === 0xcb ||
		marker === 0xcd ||
		marker === 0xce ||
		marker === 0xcf
	);
}

function parseDimensionsFromBytes(bytes: Uint8Array): ImageDimensions | null {
	if (bytes.length < 12) return null;

	// PNG
	if (
		bytes.length >= 24 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const type = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
		if (type !== "IHDR") return null;
		const width = view.getUint32(16, false);
		const height = view.getUint32(20, false);
		if (width > 0 && height > 0) return { width, height };
		return null;
	}

	// GIF
	if (
		bytes[0] === 0x47 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x38 &&
		(bytes[4] === 0x37 || bytes[4] === 0x39) &&
		bytes[5] === 0x61
	) {
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const width = view.getUint16(6, true);
		const height = view.getUint16(8, true);
		if (width > 0 && height > 0) return { width, height };
		return null;
	}

	// BMP
	if (bytes[0] === 0x42 && bytes[1] === 0x4d && bytes.length >= 26) {
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const width = view.getInt32(18, true);
		const height = Math.abs(view.getInt32(22, true));
		if (width > 0 && height > 0) return { width, height };
		return null;
	}

	// WebP (VP8X)
	if (
		bytes.length >= 30 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		let offset = 12;
		while (offset + 8 <= bytes.length) {
			const chunkType = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
			const chunkSize =
				bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24);
			offset += 8;
			if (chunkType === "VP8X" && offset + 10 <= bytes.length) {
				const w = 1 + bytes[offset + 4] + (bytes[offset + 5] << 8) + (bytes[offset + 6] << 16);
				const h = 1 + bytes[offset + 7] + (bytes[offset + 8] << 8) + (bytes[offset + 9] << 16);
				if (w > 0 && h > 0) return { width: w, height: h };
				return null;
			}
			offset += chunkSize + (chunkSize % 2);
		}
	}

	// JPEG
	if (bytes[0] === 0xff && bytes[1] === 0xd8) {
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		let offset = 2;
		while (offset + 4 <= bytes.length) {
			if (bytes[offset] !== 0xff) {
				offset++;
				continue;
			}
			let marker = bytes[offset + 1];
			offset += 2;

			while (marker === 0xff && offset < bytes.length) {
				marker = bytes[offset];
				offset++;
			}

			if (marker === 0xd9 || marker === 0xda) break;
			if (offset + 2 > bytes.length) break;
			const segmentLength = view.getUint16(offset, false);
			if (segmentLength < 2) break;
			const segmentStart = offset + 2;
			if (isJpegSOFMarker(marker) && segmentStart + 5 < bytes.length) {
				const height = view.getUint16(segmentStart + 1, false);
				const width = view.getUint16(segmentStart + 3, false);
				if (width > 0 && height > 0) return { width, height };
				return null;
			}
			offset = segmentStart + (segmentLength - 2);
		}
	}

	// HEIC/HEIF (ftyp box)
	if (
		bytes.length >= 12 &&
		bytes[4] === 0x66 && // 'f'
		bytes[5] === 0x74 && // 't'
		bytes[6] === 0x79 && // 'y'
		bytes[7] === 0x70 // 'p'
	) {
		// HEIC dimension parsing is complex, return null for now
		// Would require full ISO Base Media File Format parsing
		return null;
	}

	// AVIF (ftyp box with avif brand)
	if (
		bytes.length >= 12 &&
		bytes[4] === 0x66 && // 'f'
		bytes[5] === 0x74 && // 't'
		bytes[6] === 0x79 && // 'y'
		bytes[7] === 0x70 && // 'p'
		bytes[8] === 0x61 && // 'a'
		bytes[9] === 0x76 && // 'v'
		bytes[10] === 0x69 && // 'i'
		bytes[11] === 0x66 // 'f'
	) {
		// AVIF dimension parsing is complex, return null for now
		return null;
	}

	// ICO
	if (bytes.length >= 22 && bytes[0] === 0x00 && bytes[1] === 0x00) {
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const numImages = view.getUint16(4, true);
		if (numImages > 0 && bytes.length >= 22) {
			// Get dimensions from first icon entry
			const width = bytes[6] === 0 ? 256 : bytes[6];
			const height = bytes[7] === 0 ? 256 : bytes[7];
			if (width > 0 && height > 0) return { width, height };
		}
		return null;
	}

	// TGA (simple header parsing)
	if (bytes.length >= 18) {
		// TGA header: ID length (1), colormap type (1), image type (1), colormap spec (5), origin (4), dimensions (4)
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const imageType = bytes[2];
		// Only support uncompressed and RLE true-color images
		if (imageType === 2 || imageType === 10) {
			const width = view.getUint16(12, true);
			const height = view.getUint16(14, true);
			if (width > 0 && height > 0) return { width, height };
		}
	}

	// EXR (magic number)
	if (
		bytes.length >= 4 &&
		bytes[0] === 0x76 && // 'v'
		bytes[1] === 0x2f && // '/'
		bytes[2] === 0x30 && // '0'
		bytes[3] === 0x31 // '1'
	) {
		// EXR dimension parsing is complex, return null for now
		return null;
	}

	// HDR (magic number)
	if (
		bytes.length >= 11 &&
		bytes[0] === 0x23 && // '#'
		bytes[1] === 0x3f && // '?'
		bytes[2] === 0x52 && // 'R'
		bytes[3] === 0x41 && // 'A'
		bytes[4] === 0x44 && // 'D'
		bytes[5] === 0x49 && // 'I'
		bytes[6] === 0x41 && // 'A'
		bytes[7] === 0x4e && // 'N'
		bytes[8] === 0x43 && // 'C'
		bytes[9] === 0x45 && // 'E'
		bytes[10] === 0x20 // ' '
	) {
		// HDR is ASCII format, would require text parsing
		return null;
	}

	return null;
}

async function extractOriginalDimensions(blob: Blob): Promise<ImageDimensions | null> {
	try {
		const header = new Uint8Array(await blob.slice(0, 256 * 1024).arrayBuffer());
		return parseDimensionsFromBytes(header);
	} catch {
		return null;
	}
}

async function logTauri(message: string, level: "info" | "warn" | "error" | "debug" = "info") {
	try {
		await invoke("logger", { level, message });
	} catch {
		console.log(message);
	}
}

class NavigationStore {
	// List of image paths in current folder
	images = $state<string[]>([]);

	// Current image index (-1 if no image loaded)
	currentIndex = $state(-1);

	// Current folder path
	currentFolder = $state<string | null>(null);

	// Loading state for folder scan
	isScanning = $state(false);
	private decodeResizeWidth = 0;

	// Derived values
	get totalImages(): number {
		return this.images.length;
	}

	get hasImages(): boolean {
		return this.images.length > 0;
	}

	get canGoNext(): boolean {
		return this.currentIndex < this.images.length - 1;
	}

	get canGoPrev(): boolean {
		return this.currentIndex > 0;
	}

	get currentPath(): string | null {
		if (this.currentIndex >= 0 && this.currentIndex < this.images.length) {
			return this.images[this.currentIndex];
		}
		return null;
	}

	get positionText(): string {
		if (!this.hasImages || this.currentIndex < 0) return "";
		return `${this.currentIndex + 1} / ${this.totalImages}`;
	}

	/**
	 * Scan folder for images when a file is opened
	 */
	async scanFolder(filePath: string): Promise<void> {
		const tStart = performance.now();
		let folderPath = "";
		try {
			this.isScanning = true;

			// Extract folder path from file path
			folderPath = this.getFolderPath(filePath);
			const fileName = this.getFileName(filePath);

			console.log(`[Navigation] Scanning folder: ${folderPath}`);
			await logTauri(`[Navigation] Scanning folder: ${folderPath}`, "info");

			// Read directory contents
			const entries = await readDir(folderPath);

			// Filter for image files and sort alphabetically
			const imageFiles: string[] = [];

			for (const entry of entries) {
				if (entry.isFile && entry.name) {
					const ext = this.getExtension(entry.name).toLowerCase();
					if (SUPPORTED_FORMATS.includes(ext)) {
						// Construct full path
						const fullPath = this.joinPath(folderPath, entry.name);
						imageFiles.push(fullPath);
					}
				}
			}

			// Sort alphabetically (case-insensitive)
			imageFiles.sort((a, b) => {
				const nameA = this.getFileName(a).toLowerCase();
				const nameB = this.getFileName(b).toLowerCase();
				return nameA.localeCompare(nameB, undefined, { numeric: true });
			});

			this.images = imageFiles;
			this.currentFolder = folderPath;

			// Find current file index
			this.currentIndex = imageFiles.findIndex((p) => this.getFileName(p) === fileName);

			console.log(`[Navigation] Found ${imageFiles.length} images, current index: ${this.currentIndex}`);
			await logTauri(`[Navigation] Found ${imageFiles.length} images in folder`, "info");

			// Preload adjacent images
			this.preloadAdjacent();
		} catch (error) {
			console.error("[Navigation] Failed to scan folder:", error);
			await logTauri(`[Navigation] Failed to scan folder: ${error}`, "error");
			this.reset();
		} finally {
			this.isScanning = false;
			const tEnd = performance.now();
			logger.info(`scanFolder completed in ${(tEnd - tStart).toFixed(1)}ms`, "PERF/Navigation", {
				folder: folderPath,
				imageCount: this.images.length,
			});
		}
	}

	/**
	 * Navigate to next image
	 */
	goNext(): string | null {
		if (!this.canGoNext) return null;
		const previousIndex = this.currentIndex;
		this.currentIndex++;
		logger.info(`navigate NEXT to index ${this.currentIndex + 1}`, "NAV/Move", {
			direction: "next",
			fromIndex: previousIndex + 1,
			toIndex: this.currentIndex + 1,
			file: this.getFileName(this.currentPath ?? ""),
		});
		this.preloadAdjacent();
		return this.currentPath;
	}

	/**
	 * Navigate to previous image
	 */
	goPrev(): string | null {
		if (!this.canGoPrev) return null;
		const previousIndex = this.currentIndex;
		this.currentIndex--;
		logger.info(`navigate PREV to index ${this.currentIndex + 1}`, "NAV/Move", {
			direction: "prev",
			fromIndex: previousIndex + 1,
			toIndex: this.currentIndex + 1,
			file: this.getFileName(this.currentPath ?? ""),
		});
		this.preloadAdjacent();
		return this.currentPath;
	}

	/**
	 * Navigate to first image
	 */
	goFirst(): string | null {
		if (!this.hasImages) return null;
		const previousIndex = this.currentIndex;
		this.currentIndex = 0;
		logger.info(`navigate FIRST to index ${this.currentIndex + 1}`, "NAV/Move", {
			direction: "first",
			fromIndex: previousIndex + 1,
			toIndex: this.currentIndex + 1,
			file: this.getFileName(this.currentPath ?? ""),
		});
		this.preloadAdjacent();
		return this.currentPath;
	}

	/**
	 * Navigate to last image
	 */
	goLast(): string | null {
		if (!this.hasImages) return null;
		const previousIndex = this.currentIndex;
		this.currentIndex = this.images.length - 1;
		logger.info(`navigate LAST to index ${this.currentIndex + 1}`, "NAV/Move", {
			direction: "last",
			fromIndex: previousIndex + 1,
			toIndex: this.currentIndex + 1,
			file: this.getFileName(this.currentPath ?? ""),
		});
		this.preloadAdjacent();
		return this.currentPath;
	}

	/**
	 * Navigate to specific index
	 */
	goToIndex(index: number): string | null {
		if (index < 0 || index >= this.images.length) return null;
		const previousIndex = this.currentIndex;
		this.currentIndex = index;
		logger.info(`navigate INDEX to ${this.currentIndex + 1}`, "NAV/Move", {
			direction: "index",
			fromIndex: previousIndex + 1,
			toIndex: this.currentIndex + 1,
			file: this.getFileName(this.currentPath ?? ""),
		});
		this.preloadAdjacent();
		return this.currentPath;
	}

	/**
	 * Preload adjacent images for instant navigation
	 * Preloads PRELOAD_AHEAD images forward and PRELOAD_BEHIND images backward
	 */
	private preloadAdjacent(): void {
		// Preload next N images
		for (let i = 1; i <= PRELOAD_AHEAD; i++) {
			const index = this.currentIndex + i;
			if (index < this.images.length) {
				void this.preloadImage(this.images[index]);
			}
		}

		// Preload previous N images
		for (let i = 1; i <= PRELOAD_BEHIND; i++) {
			const index = this.currentIndex - i;
			if (index >= 0) {
				void this.preloadImage(this.images[index]);
			}
		}

		// Clean up old cache entries (keep window of ±3 around current)
		this.cleanupCache();
	}

	setDecodeResizeWidth(resizeWidth: number): void {
		this.decodeResizeWidth = resizeWidth;
	}

	getAdjacentPaths(): string[] {
		const paths: string[] = [];

		for (let i = 1; i <= PRELOAD_AHEAD; i++) {
			const index = this.currentIndex + i;
			if (index < this.images.length) {
				paths.push(this.images[index]);
			}
		}

		for (let i = 1; i <= PRELOAD_BEHIND; i++) {
			const index = this.currentIndex - i;
			if (index >= 0) {
				paths.push(this.images[index]);
			}
		}

		return paths;
	}

	/**
	 * Preload a single image into memory cache
	 */
	private async preloadImage(path: string): Promise<void> {
		// Skip if already cached
		const resizeWidth = this.getEffectiveDecodeResizeWidth();
		const existing = imageCache.get(path);
		if (existing && existing.resizeWidth >= resizeWidth) return;

		try {
			const tStart = performance.now();
			const bitmap = await this.getOrDecodeBitmap(path, resizeWidth);
			if (!bitmap) return;
			console.log(`[Navigation] Cached: ${this.getFileName(path)} (${imageCache.size} total)`);
			const tEnd = performance.now();
			logger.info(`preloadBitmap decoded in ${(tEnd - tStart).toFixed(1)}ms`, "PERF/Preload", {
				path,
				width: bitmap.width,
				height: bitmap.height,
				resizeWidth,
				name: this.getFileName(path),
			});
		} catch (error) {
			console.warn(`[Navigation] Failed to preload: ${path}`, error);
		}
	}

	private getEffectiveDecodeResizeWidth(): number {
		if (this.decodeResizeWidth > 0) return this.decodeResizeWidth;
		const dpr = globalThis.devicePixelRatio || 1;
		return Math.min(
			Math.ceil(Math.max(globalThis.innerWidth || 0, globalThis.innerHeight || 0) * dpr * DECODE_SCALE_FACTOR),
			DECODE_MAX_WIDTH
		);
	}

	private async convertSvgToBitmap(blob: Blob, resizeWidth?: number): Promise<ImageBitmap> {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(blob);
			const img = new Image();
			img.crossOrigin = "anonymous";

			img.onload = () => {
				try {
					URL.revokeObjectURL(url);

					// Create canvas to render SVG
					const canvas = document.createElement("canvas");
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						reject(new Error("Could not get canvas context"));
						return;
					}

					// Calculate dimensions
					let width = img.width;
					let height = img.height;

					if (resizeWidth && width > resizeWidth) {
						const scale = resizeWidth / width;
						width = resizeWidth;
						height = Math.round(height * scale);
					}

					canvas.width = width;
					canvas.height = height;

					// Draw SVG to canvas
					ctx.drawImage(img, 0, 0, width, height);

					// Convert to ImageBitmap
					createImageBitmap(canvas).then(resolve).catch(reject);
				} catch (error) {
					reject(error);
				}
			};

			img.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error("Failed to load SVG image"));
			};

			img.src = url;
		});
	}

	private async decodeBitmap(path: string, resizeWidth?: number): Promise<ImageBitmap> {
		const url = convertFileSrc(path);
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`Failed to fetch image for bitmap decode (status ${res.status}, resizeWidth ${resizeWidth})`);
		}
		const blob = await res.blob();

		// Check if this is an SVG file
		const ext = this.getExtension(path).toLowerCase();
		if (ext === "svg") {
			return await this.convertSvgToBitmap(blob, resizeWidth);
		}

		let dims = originalDimensionsCache.get(path) ?? null;
		if (!dims) {
			dims = await extractOriginalDimensions(blob);
			if (dims) {
				originalDimensionsCache.set(path, dims);
			}
		}

		let effectiveResizeWidth = dims ? Math.min(resizeWidth ?? Infinity, dims.width) : resizeWidth ?? Infinity;
		const isLargeByBytes = blob.size >= previewLargeImageBytes;
		const isLargeByMegapixels = dims ? (dims.width * dims.height) / 1_000_000 >= previewLargeImageMegapixels : false;
		const isLargeImage = isLargeByBytes || isLargeByMegapixels;
		if (previewMode !== "off" && isLargeImage) {
			if (previewMode === "aggressive") {
				effectiveResizeWidth = Math.min(effectiveResizeWidth, previewAggressiveMaxWidth);
			} else if (previewMode === "progressive") {
				effectiveResizeWidth = Math.min(effectiveResizeWidth, previewProgressiveStage2Width);
			}
		}
		if (dims && effectiveResizeWidth >= dims.width) {
			return await createImageBitmap(blob);
		}
		try {
			return await createImageBitmap(blob, { resizeWidth: effectiveResizeWidth, resizeQuality: "high" });
		} catch {
			return await createImageBitmap(blob);
		}
	}

	private getExtension(path: string): string {
		const parts = path.split(".");
		return parts.length > 1 ? parts[parts.length - 1] : "";
	}

	/**
	 * Clean up cache entries far from current position
	 */
	private cleanupCache(): void {
		const keepRange = Math.max(PRELOAD_AHEAD, PRELOAD_BEHIND) + 1;
		const currentPath = this.currentPath;

		// Get paths to keep (within range of current)
		const pathsToKeep = new Set<string>();
		for (let i = -keepRange; i <= keepRange; i++) {
			const index = this.currentIndex + i;
			if (index >= 0 && index < this.images.length) {
				pathsToKeep.add(this.images[index]);
			}
		}

		// Remove entries not in keep range
		for (const path of imageCache.keys()) {
			if (!pathsToKeep.has(path)) {
				imageCache.get(path)?.bitmap.close();
				imageCache.delete(path);
				originalDimensionsCache.delete(path);
				console.log(`[Navigation] Evicted from cache: ${this.getFileName(path)}`);
			}
		}
	}

	/**
	 * Check if an image is already cached
	 */
	isImageCached(path: string): boolean {
		return imageCache.has(path);
	}

	/**
	 * Get cached image (if available)
	 */
	getCachedBitmap(path: string): ImageBitmap | null {
		return imageCache.get(path)?.bitmap ?? null;
	}

	getOriginalDimensions(path: string): ImageDimensions | null {
		return originalDimensionsCache.get(path) ?? null;
	}

	async getOrDecodeBitmap(path: string, resizeWidth?: number): Promise<ImageBitmap | null> {
		const effectiveResizeWidth = resizeWidth ?? this.getEffectiveDecodeResizeWidth();
		const existing = imageCache.get(path);
		if (existing && existing.resizeWidth >= effectiveResizeWidth) {
			return existing.bitmap;
		}

		const inFlight = inFlightDecodes.get(path);
		if (inFlight && inFlight.resizeWidth >= effectiveResizeWidth) {
			try {
				await inFlight.promise;
				return imageCache.get(path)?.bitmap ?? null;
			} catch {
				return null;
			}
		}

		try {
			const token = ++inFlightTokenCounter;
			const promise = (async () => {
				const bitmap = await this.decodeBitmap(path, effectiveResizeWidth);
				const current = imageCache.get(path);
				if (current && current.resizeWidth >= effectiveResizeWidth) {
					bitmap.close();
					return;
				}
				if (current) {
					current.bitmap.close();
				}
				imageCache.set(path, { bitmap, resizeWidth: effectiveResizeWidth });
			})();

			inFlightDecodes.set(path, {
				resizeWidth: effectiveResizeWidth,
				token,
				promise: promise.finally(() => {
					const cur = inFlightDecodes.get(path);
					if (cur?.token === token) {
						inFlightDecodes.delete(path);
					}
				}),
			});

			await inFlightDecodes.get(path)!.promise;
			return imageCache.get(path)?.bitmap ?? null;
		} catch {
			return null;
		}
	}

	/**
	 * Reset navigation state
	 */
	reset(): void {
		this.images = [];
		this.currentIndex = -1;
		this.currentFolder = null;
		this.isScanning = false;

		for (const entry of imageCache.values()) {
			entry.bitmap.close();
		}
		imageCache.clear();
		originalDimensionsCache.clear();
		console.log("[Navigation] Cache cleared");
	}

	// Path utility functions
	private getFolderPath(filePath: string): string {
		const separator = filePath.includes("\\") ? "\\" : "/";
		const parts = filePath.split(separator);
		parts.pop(); // Remove filename
		return parts.join(separator);
	}

	private getFileName(filePath: string): string {
		const separator = filePath.includes("\\") ? "\\" : "/";
		const parts = filePath.split(separator);
		return parts[parts.length - 1] || "";
	}

	private joinPath(folder: string, fileName: string): string {
		const separator = folder.includes("\\") ? "\\" : "/";
		return `${folder}${separator}${fileName}`;
	}
}

// Singleton pattern
const DEFAULT_NAV_KEY = Symbol("default_nav_key");
export const navigationStore = new Map<symbol, NavigationStore>();

export function getNavigationStore(key: symbol = DEFAULT_NAV_KEY): NavigationStore {
	if (!navigationStore.has(key)) {
		navigationStore.set(key, new NavigationStore());
	}
	return navigationStore.get(key)!;
}
