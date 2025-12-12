import { open } from "@tauri-apps/plugin-dialog";
import { stat } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { getNavigationStore } from "./navigationStore.svelte";
import { logger } from "$lib/utils/logger";

// Supported image formats
export const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif", "svg"];

export const IMAGE_FILTER = {
	name: "Images",
	extensions: SUPPORTED_FORMATS,
};

// File information interface
export interface FileInfo {
	path: string;
	name: string;
	extension: string;
	size: number;
	lastModified: Date;
	formattedSize: string;
}

class FileService {
	currentFile = $state<FileInfo | null>(null);
	error = $state<string | null>(null);
	isLoading = $state(false);

	// Flag to indicate if current load is from navigation (prev/next)
	// When true, skip showing loading spinner
	isNavigating = $state(false);

	async openFile(): Promise<FileInfo | null> {
		const tStart = performance.now();
		try {
			this.isLoading = true;
			this.error = null;

			await logTauri("[FileService] Starting file selection dialog", "info");
			console.log("[FileService] Opening file dialog with filters:", IMAGE_FILTER);

			const selected = await open({
				multiple: false,
				filters: [IMAGE_FILTER],
			});

			console.log("[FileService] File dialog result:", selected);
			await logTauri(`[FileService] File dialog returned: ${selected || "null"}`, "debug");

			if (selected) {
				await logTauri(`[FileService] Processing selected file: ${selected}`, "info");
				console.log("[FileService] Selected file path:", selected);
				console.log("[FileService] File path type:", typeof selected);
				console.log("[FileService] File path length:", selected.length);

				// Validate the file path before processing
				const validationError = this.validateFilePath(selected);
				if (validationError) {
					this.error = validationError;
					await logTauri(`[FileService] Validation failed: ${validationError}`, "warn");
					console.error("[FileService] Path validation failed:", validationError);
					return null;
				}

				await logTauri("[FileService] Path validation passed, extracting file info", "debug");
				const fileInfo = await this.extractFileInfo(selected);
				console.log("[FileService] Extracted file info:", fileInfo);

				// Additional validation on extracted file info
				if (!this.validateImageFormat(fileInfo.extension)) {
					const formatError = `Unsupported image format: .${
						fileInfo.extension
					}. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`;
					this.error = formatError;
					await logTauri(formatError, "warn");
					return null;
				}

				this.currentFile = fileInfo;
				console.log("[FileService] File successfully set as current:", fileInfo);
				await logTauri(
					`[FileService] Successfully opened file: ${fileInfo.name} (${fileInfo.extension.toUpperCase()}, ${
						fileInfo.formattedSize
					})`,
					"info"
				);
				await logTauri(`[FileService] Full file path: ${fileInfo.path}`, "debug");

				// Trigger folder scan for navigation
				const navStore = getNavigationStore();
				navStore.scanFolder(fileInfo.path);

				return fileInfo;
			}

			return null;
		} catch (error) {
			const errorMsg = `[FileService] Failed to open file: ${error}`;
			this.error = errorMsg;
			console.error("[FileService] Exception during file opening:", error);
			await logTauri(errorMsg, "error");
			return null;
		} finally {
			this.isLoading = false;
			console.log("[FileService] File opening process completed, isLoading set to false");
			const tEnd = performance.now();
			logger.info(`openFile completed in ${(tEnd - tStart).toFixed(1)}ms`, "PERF/FileService", {
				hasFile: this.currentFile !== null,
				name: this.currentFile?.name ?? null,
				size: this.currentFile?.size ?? null,
				formattedSize: this.currentFile?.formattedSize ?? null,
			});
		}
	}

	private async extractFileInfo(filePath: string): Promise<FileInfo> {
		console.log("[FileService] Extracting file info for:", filePath);
		const pathParts = filePath.split(/[/\\]/);
		const fileName = pathParts.at(-1) || "";
		const extension = fileName.split(".").pop()?.toLowerCase() || "";

		console.log("[FileService] Path parts:", pathParts);
		console.log("[FileService] Extracted filename:", fileName);
		console.log("[FileService] Extracted extension:", extension);

		try {
			// Get file metadata using Tauri fs plugin
			console.log("[FileService] Getting file metadata via Tauri fs plugin");
			const metadata = await stat(filePath);
			console.log("[FileService] Raw metadata from stat:", metadata);

			// Handle different timestamp formats that might be returned
			let lastModified: Date;
			if (metadata.mtime) {
				// mtime might be a Date object or a timestamp object with secs property
				if (typeof metadata.mtime === "object" && "secs" in metadata.mtime) {
					lastModified = new Date((metadata.mtime as any).secs * 1000);
				} else if (metadata.mtime instanceof Date) {
					lastModified = metadata.mtime;
				} else {
					lastModified = new Date(metadata.mtime);
				}
			} else {
				lastModified = new Date();
			}

			const fileInfo = {
				path: filePath,
				name: fileName,
				extension: extension,
				size: metadata.size,
				lastModified: lastModified,
				formattedSize: this.formatFileSize(metadata.size),
			};

			console.log("[FileService] Created fileInfo object:", fileInfo);
			await logTauri(
				`[FileService] File info extracted - Size: ${metadata.size} bytes, Modified: ${lastModified.toISOString()}`,
				"debug"
			);

			return fileInfo;
		} catch (error) {
			// If metadata extraction fails, return basic info with defaults
			console.error("[FileService] Failed to extract metadata:", error);
			await logTauri(`[FileService] Failed to extract metadata for ${fileName}: ${error}`, "warn");
			const basicFileInfo = {
				path: filePath,
				name: fileName,
				extension: extension,
				size: 0,
				lastModified: new Date(),
				formattedSize: "Unknown",
			};
			console.log("[FileService] Using basic file info:", basicFileInfo);
			return basicFileInfo;
		}
	}

	/**
	 * Format file size in a human-readable format
	 */
	private formatFileSize(bytes: number): string {
		if (bytes === 0) return "0 Bytes";

		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	/**
	 * Validates a file path for common issues
	 * @param filePath - The file path to validate
	 * @returns Error message if invalid, null if valid
	 */
	validateFilePath(filePath: string): string | null {
		console.log("[FileService] Validating file path:", filePath);

		// Check if file path is empty or null
		if (!filePath || filePath.trim() === "") {
			console.warn("[FileService] File path is empty or invalid");
			return "File path is empty or invalid";
		}

		// Check for basic path injection or malicious patterns
		const suspiciousPatterns = ["..\\", "../", "<", ">", "|", "*", "?"];
		for (const pattern of suspiciousPatterns) {
			if (filePath.includes(pattern)) {
				return `File path contains potentially unsafe characters: ${pattern}`;
			}
		}

		// Check path length (most systems have limits)
		if (filePath.length > 260) {
			return "File path is too long (maximum 260 characters)";
		}

		// Check if the file has an extension
		if (!filePath.includes(".")) {
			return "File must have an extension";
		}

		// Platform-specific validations
		const userAgent = navigator.userAgent.toLowerCase();
		const isWindows = userAgent.includes("windows") || userAgent.includes("win32") || userAgent.includes("win64");

		if (isWindows) {
			// Windows reserved names
			const windowsReserved = [
				"CON",
				"PRN",
				"AUX",
				"NUL",
				"COM1",
				"COM2",
				"COM3",
				"COM4",
				"COM5",
				"COM6",
				"COM7",
				"COM8",
				"COM9",
				"LPT1",
				"LPT2",
				"LPT3",
				"LPT4",
				"LPT5",
				"LPT6",
				"LPT7",
				"LPT8",
				"LPT9",
			];
			const fileName = filePath.split(/[/\\]/).pop()?.split(".")[0]?.toUpperCase();
			if (fileName && windowsReserved.includes(fileName)) {
				return `File name "${fileName}" is reserved on Windows`;
			}
		}

		console.log("[FileService] File path validation passed");
		return null; // Valid path
	}

	isValidPath(filePath: string): boolean {
		return this.validateFilePath(filePath) === null;
	}

	validateImageFormat(extension: string): boolean {
		const isValid = SUPPORTED_FORMATS.includes(extension.toLowerCase());
		console.log(`[FileService] Format validation for .${extension}:`, isValid);
		return isValid;
	}

	isValidImageFile(fileInfo: FileInfo): boolean {
		return this.validateImageFormat(fileInfo.extension);
	}

	async openFileByPath(filePath: string, skipFolderScan = false): Promise<FileInfo | null> {
		const tStart = performance.now();
		try {
			this.isLoading = true;
			this.error = null;
			// Set navigation flag - skipFolderScan=true means this is a prev/next navigation
			this.isNavigating = skipFolderScan;

			await logTauri(`[FileService] Loading file by path: ${filePath}${skipFolderScan ? " (navigation)" : ""}`, "info");
			console.log("[FileService] Loading file by path:", filePath, skipFolderScan ? "(navigation)" : "");

			// Validate and extract file info
			if (!this.isValidPath(filePath)) {
				throw new Error("Invalid file path");
			}

			const fileInfo = await this.extractFileInfo(filePath);
			if (!fileInfo) {
				throw new Error("Failed to extract file information");
			}

			// Validate file type
			if (!this.isValidImageFile(fileInfo)) {
				throw new Error(`Unsupported file type: .${fileInfo.extension}`);
			}

			this.currentFile = fileInfo;

			await logTauri(
				`[FileService] Successfully opened file: ${fileInfo.name} (${fileInfo.extension.toUpperCase()}, ${
					fileInfo.formattedSize
				})`,
				"info"
			);

			// Trigger folder scan for navigation (unless skipped for navigation)
			if (!skipFolderScan) {
				const navStore = getNavigationStore();
				navStore.scanFolder(fileInfo.path);
			}

			console.log("[FileService] File successfully loaded:", fileInfo);
			return fileInfo;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			console.error("[FileService] Error loading file by path:", error);
			await logTauri(`[FileService] Error loading file by path: ${errorMessage}`, "error");
			this.error = errorMessage;
			return null;
		} finally {
			this.isLoading = false;
			this.isNavigating = false;
			const tEnd = performance.now();
			logger.info(`openFileByPath completed in ${(tEnd - tStart).toFixed(1)}ms`, "PERF/FileService", {
				path: filePath,
				navigation: skipFolderScan,
				name: this.currentFile?.name ?? null,
				size: this.currentFile?.size ?? null,
				formattedSize: this.currentFile?.formattedSize ?? null,
			});
		}
	}

	clearError() {
		this.error = null;
	}

	clearFile() {
		this.currentFile = null;
		this.error = null;

		// Reset navigation
		const navStore = getNavigationStore();
		navStore.reset();
	}
}

// Tauri logger helper
async function logTauri(message: string, level: "info" | "warn" | "error" | "debug" = "info") {
	try {
		await invoke("logger", { level, message });
	} catch (error) {
		let consoleMethod: "error" | "warn" | "log";
		if (level === "error") {
			consoleMethod = "error";
		} else if (level === "warn") {
			consoleMethod = "warn";
		} else {
			consoleMethod = "log";
		}
		console[consoleMethod](message);
		console.error("Failed to log to Tauri:", error);
	}
}

// Singleton instance
const DEFAULT_FILE_SERVICE_KEY = Symbol("default_file_service_key");
export const fileServiceStore = new Map<symbol, FileService>();

export function getFileService(key: symbol = DEFAULT_FILE_SERVICE_KEY): FileService {
	if (!fileServiceStore.has(key)) {
		fileServiceStore.set(key, new FileService());
	}
	return fileServiceStore.get(key)!;
}
