# Copilot Custom Instructions for pancar-do

- **Always use Svelte 5 runes syntax** for all Svelte components and code examples. Avoid legacy Svelte syntax.
- use custom svelte classes with svelte 5 runes($state) for state management. example:

```typescript
// counterStore.svelte.ts

import { $state } from "svelte/runes";

class Counter {
	count = $state(0);

	increment() {
		this.count.set(this.count.get() + 1);
	}

	decrement() {
		this.count.set(this.count.get() - 1);
	}

	reset() {
		this.count.set(0);
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
```

- **Always use Tauri v2 APIs and conventions** for all Tauri-related code, including Rust backend and JavaScript/TypeScript frontend integration.
- When suggesting code, configuration, or refactoring, ensure compatibility with Svelte 5 runes and Tauri v2.
- Do not use deprecated or legacy APIs from Svelte or Tauri.
- All new features, bugfixes, and refactors must follow these requirements.
- always examine the current implementation before suggesting changes.
- when suggesting changes, always provide step by step reasoning for the proposed changes.
- always use tauri logger for logging into rust backend from ui

```typescript
async function logTauri(message: string, level: "info" | "warn" | "error" | "debug" = "error") {
	try {
		await invoke("logger", { level, message });
	} catch (error) {
		// Fallback to console if logger fails
		console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](message);
	}
}
```

```rust
#[tauri::command]
fn logger(level: &str, message: &str) {
    match level {
        "info" => println!("[INFO] {}", message),
        "warn" => println!("[WARN] {}", message),
        "error" => eprintln!("[ERROR] {}", message),
        "debug" => println!("[DEBUG] {}", message),
        _ => println!("[LOG] {}", message),
    }
}
```
