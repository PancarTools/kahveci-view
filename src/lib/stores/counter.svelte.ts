import { invoke } from "@tauri-apps/api/core";

async function logTauri(message: string, level: "info" | "warn" | "error" | "debug" = "info") {
	try {
		await invoke("logger", { level, message });
	} catch (error) {
		// Fallback to console if logger fails
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

class Counter {
	count = $state(0);

	async increment() {
		this.count++;
		await logTauri(`Counter incremented to ${this.count}`, "info");
	}

	async decrement() {
		this.count--;
		await logTauri(`Counter decremented to ${this.count}`, "info");
	}

	async reset() {
		const previousValue = this.count;
		this.count = 0;
		await logTauri(`Counter reset from ${previousValue} to ${this.count}`, "info");
	}

	async setValue(value: number) {
		const previousValue = this.count;
		this.count = value;
		await logTauri(`Counter value changed from ${previousValue} to ${this.count}`, "info");
	}
}

const DEFAULT_COUNTER_KEY = Symbol("default_counter_key");
export const counterStore = new Map<symbol, Counter>();

export function getCounter(key: symbol = DEFAULT_COUNTER_KEY): Counter {
	if (!counterStore.has(key)) {
		counterStore.set(key, new Counter());
	}
	return counterStore.get(key)!;
}
