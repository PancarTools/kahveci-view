// Navigation store for image folder navigation
// Tracks sibling images in folder and current position

import { readDir } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { logger } from "$lib/utils/logger";

// Supported image formats (must match fileService)
const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "svg"];

// === PRELOADING CONFIGURATION ===
// Number of images to preload ahead/behind current image
const PRELOAD_AHEAD = 2; // Preload next 2 images
const PRELOAD_BEHIND = 1; // Preload previous 1 image

const DECODE_SCALE_FACTOR = 1.25;
const DECODE_MAX_WIDTH = 4096;

// Cache for preloaded images (keeps them in memory)
type CachedBitmapEntry = { bitmap: ImageBitmap; resizeWidth: number };
const imageCache = new Map<string, CachedBitmapEntry>();
type InFlightDecodeEntry = { resizeWidth: number; token: number; promise: Promise<void> };
const inFlightDecodes = new Map<string, InFlightDecodeEntry>();
let inFlightTokenCounter = 0;

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

	private async decodeBitmap(path: string, resizeWidth: number): Promise<ImageBitmap> {
		const url = convertFileSrc(path);
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`Failed to fetch image for bitmap decode (status ${res.status}, resizeWidth ${resizeWidth})`);
		}
		const blob = await res.blob();
		try {
			return await createImageBitmap(blob, { resizeWidth, resizeQuality: "high" });
		} catch {
			return await createImageBitmap(blob);
		}
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

	private getExtension(fileName: string): string {
		const parts = fileName.split(".");
		return parts.length > 1 ? parts[parts.length - 1] : "";
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
