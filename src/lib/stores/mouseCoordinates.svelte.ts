// Mouse coordinates store for image viewer
// Tracks mouse position relative to the image for status bar display

class MouseCoordinates {
	x = $state(0);
	y = $state(0);
	isOverImage = $state(false);

	updatePosition(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	setOverImage(isOver: boolean) {
		this.isOverImage = isOver;
	}

	reset() {
		this.x = 0;
		this.y = 0;
		this.isOverImage = false;
	}
}

const DEFAULT_MOUSE_KEY = Symbol("default_mouse_key");
export const mouseCoordinatesStore = new Map<symbol, MouseCoordinates>();

export function getMouseCoordinates(key: symbol = DEFAULT_MOUSE_KEY): MouseCoordinates {
	if (!mouseCoordinatesStore.has(key)) {
		mouseCoordinatesStore.set(key, new MouseCoordinates());
	}
	return mouseCoordinatesStore.get(key)!;
}
