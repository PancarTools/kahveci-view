import { invoke } from "@tauri-apps/api/core";

// Debug logging flag - can be controlled via environment variable or localStorage
const DEBUG_KEY = "KAHVECI_DEBUG";

// Check if debug logging is enabled
export function isDebugEnabled(): boolean {
	// Check localStorage first (for runtime control)
	const stored = localStorage.getItem(DEBUG_KEY);
	if (stored !== null) {
		return stored === "true";
	}

	// Check environment variable (for build-time control)
	if (globalThis.window !== undefined && (globalThis.window as any).__TAURI_INTERNALS__) {
		// In Tauri, we can check for debug mode
		return true; // Enable debug logging in development by default
	}

	// Default to false in production
	return false;
}

// Toggle debug logging at runtime
export function toggleDebugLogging(): boolean {
	const current = isDebugEnabled();
	const newValue = !current;
	localStorage.setItem(DEBUG_KEY, newValue.toString());
	console.log(`Debug logging ${newValue ? "enabled" : "disabled"}`);
	return newValue;
}

// Set debug logging state
export function setDebugLogging(enabled: boolean): void {
	localStorage.setItem(DEBUG_KEY, enabled.toString());
	console.log(`Debug logging ${enabled ? "enabled" : "disabled"}`);
}

export type LogLevel = "debug" | "info" | "warn" | "error";

// Enhanced logging function with debug control
export async function logTauri(message: string, level: LogLevel = "info", context?: string, data?: any): Promise<void> {
	const timestamp = new Date().toISOString();
	const contextPrefix = context ? `[${context}]` : "";
	const fullMessage = `${contextPrefix} ${message}`;

	// Always log errors and warnings
	const shouldLog = level === "error" || level === "warn" || isDebugEnabled();

	if (shouldLog) {
		// Log to browser console with formatting
		const logMessage = `[${timestamp}] ${fullMessage}`;
		const logData = data || "";

		if (level === "error") {
			console.error(logMessage, logData);
		} else if (level === "warn") {
			console.warn(logMessage, logData);
		} else if (level === "debug") {
			console.debug(logMessage, logData);
		} else {
			console.log(logMessage, logData);
		}

		// Also log to Tauri backend
		try {
			await invoke("logger", { level, message: fullMessage });
		} catch (error) {
			// Fallback to console if Tauri logger fails
			console.error("Failed to log to Tauri backend:", error);
		}
	}
}

// Convenience logging functions
export const logger = {
	debug: (message: string, context?: string, data?: any) => logTauri(message, "debug", context, data),
	info: (message: string, context?: string, data?: any) => logTauri(message, "info", context, data),
	warn: (message: string, context?: string, data?: any) => logTauri(message, "warn", context, data),
	error: (message: string, context?: string, data?: any) => logTauri(message, "error", context, data),

	// Performance logging
	time: (label: string) => {
		if (isDebugEnabled()) {
			console.time(`[PERF] ${label}`);
		}
	},
	timeEnd: (label: string) => {
		if (isDebugEnabled()) {
			console.timeEnd(`[PERF] ${label}`);
		}
	},

	// State change logging
	stateChange: (component: string, oldState: any, newState: any) => {
		if (isDebugEnabled()) {
			logTauri(`State change in ${component}`, "debug", "STATE", { old: oldState, new: newState });
		}
	},
};

// Global error handler
export function setupGlobalErrorHandling(): void {
	globalThis.addEventListener("error", (event) => {
		logger.error(`Global error: ${event.message}`, "GLOBAL", {
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			error: event.error,
		});
	});

	globalThis.addEventListener("unhandledrejection", (event) => {
		logger.error(`Unhandled promise rejection: ${event.reason}`, "GLOBAL", { reason: event.reason });
	});
}

// Debug utilities
export const debugUtils = {
	// Log component lifecycle
	lifecycle: (component: string, phase: "mount" | "update" | "destroy", details?: any) => {
		logger.debug(`${component} ${phase}`, "LIFECYCLE", details);
	},

	// Log API calls
	apiCall: (endpoint: string, params?: any, response?: any) => {
		logger.debug(`API call to ${endpoint}`, "API", { params, response });
	},

	// Log user interactions
	userAction: (action: string, target?: string, details?: any) => {
		const targetSuffix = target ? ` on ${target}` : "";
		logger.debug(`User action: ${action}${targetSuffix}`, "USER", details);
	},

	// Log file operations
	fileOperation: (operation: string, path: string, result?: any, error?: any) => {
		if (error) {
			logger.error(`File ${operation} failed: ${path}`, "FILE", { error });
		} else {
			logger.debug(`File ${operation}: ${path}`, "FILE", result);
		}
	},
};
