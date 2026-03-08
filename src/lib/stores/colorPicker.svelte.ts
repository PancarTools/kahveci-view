import type { ColorFormat, RGB } from "$lib/utils/colorConverter";
import { formatColor, getNextFormat } from "$lib/utils/colorConverter";

export type SelectionMode = "pointer" | "select";

class ColorPicker {
	// Color state
	currentColor = $state<RGB | null>(null);
	colorFormat = $state<ColorFormat>("oklab");
	isCopying = $state(false);
	copySuccess = $state(false);

	// Selection mode
	selectionMode = $state<SelectionMode>("pointer");
	private copyFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

	// Selection rectangle (in image coordinates)
	selectionStartX = $state(0);
	selectionStartY = $state(0);
	selectionEndX = $state(0);
	selectionEndY = $state(0);
	isSelecting = $state(false);

	setColor(color: RGB | null) {
		this.currentColor = color;
	}

	toggleFormat() {
		this.colorFormat = getNextFormat(this.colorFormat);
	}

	setFormat(format: ColorFormat) {
		this.colorFormat = format;
	}

	getFormattedColor(): string {
		if (!this.currentColor) return "";
		return formatColor(this.currentColor, this.colorFormat);
	}

	canCopyColor(): boolean {
		return this.getFormattedColor().length > 0;
	}

	async copyCurrentColor(): Promise<boolean> {
		const formattedColor = this.getFormattedColor();
		if (!formattedColor || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
			return false;
		}

		this.isCopying = true;

		try {
			await navigator.clipboard.writeText(formattedColor);
			this.copySuccess = true;
			if (this.copyFeedbackTimeout) {
				clearTimeout(this.copyFeedbackTimeout);
			}
			this.copyFeedbackTimeout = setTimeout(() => {
				this.copySuccess = false;
				this.copyFeedbackTimeout = null;
			}, 1200);
			return true;
		} catch {
			this.copySuccess = false;
			return false;
		} finally {
			this.isCopying = false;
		}
	}

	toggleSelectionMode() {
		this.selectionMode = this.selectionMode === "pointer" ? "select" : "pointer";
	}

	setSelectionMode(mode: SelectionMode) {
		this.selectionMode = mode;
	}

	startSelection(x: number, y: number) {
		this.isSelecting = true;
		this.selectionStartX = x;
		this.selectionStartY = y;
		this.selectionEndX = x;
		this.selectionEndY = y;
	}

	updateSelection(x: number, y: number) {
		if (this.isSelecting) {
			this.selectionEndX = x;
			this.selectionEndY = y;
		}
	}

	endSelection() {
		this.isSelecting = false;
	}

	clearSelection() {
		this.selectionStartX = 0;
		this.selectionStartY = 0;
		this.selectionEndX = 0;
		this.selectionEndY = 0;
		this.isSelecting = false;
	}

	get selectionRect() {
		const x1 = Math.min(this.selectionStartX, this.selectionEndX);
		const y1 = Math.min(this.selectionStartY, this.selectionEndY);
		const x2 = Math.max(this.selectionStartX, this.selectionEndX);
		const y2 = Math.max(this.selectionStartY, this.selectionEndY);

		return {
			x: x1,
			y: y1,
			width: x2 - x1,
			height: y2 - y1,
			isEmpty: x2 - x1 === 0 || y2 - y1 === 0,
		};
	}

	reset() {
		this.currentColor = null;
		this.colorFormat = "oklab";
		this.isCopying = false;
		this.copySuccess = false;
		if (this.copyFeedbackTimeout) {
			clearTimeout(this.copyFeedbackTimeout);
			this.copyFeedbackTimeout = null;
		}
		this.selectionMode = "pointer";
		this.clearSelection();
	}
}

const DEFAULT_COLOR_PICKER_KEY = Symbol("default_color_picker_key");
export const colorPickerStore = new Map<symbol, ColorPicker>();

export function getColorPicker(key: symbol = DEFAULT_COLOR_PICKER_KEY): ColorPicker {
	if (!colorPickerStore.has(key)) {
		colorPickerStore.set(key, new ColorPicker());
	}
	return colorPickerStore.get(key)!;
}
