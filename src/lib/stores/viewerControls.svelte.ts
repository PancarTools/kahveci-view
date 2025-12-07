/**
 * ViewerControls - Bridge between Toolbar and ImageViewer
 *
 * ImageViewer registers its functions here, Toolbar calls them.
 * Simple and avoids component binding complexity.
 */

type ZoomFunction = () => void;
type GetZoomFunction = () => number;

class ViewerControls {
	// Registered functions (set by ImageViewer)
	private _fitToWindow: ZoomFunction | null = null;
	private _actualSize: ZoomFunction | null = null;
	private _zoomIn: ZoomFunction | null = null;
	private _zoomOut: ZoomFunction | null = null;
	private _getZoomPercentage: GetZoomFunction | null = null;

	// Reactive state for UI
	zoomPercentage = $state(100);
	isRegistered = $state(false);

	// Register functions (called by ImageViewer on mount)
	register(fns: {
		fitToWindow: ZoomFunction;
		actualSize: ZoomFunction;
		zoomIn: ZoomFunction;
		zoomOut: ZoomFunction;
		getZoomPercentage: GetZoomFunction;
	}) {
		this._fitToWindow = fns.fitToWindow;
		this._actualSize = fns.actualSize;
		this._zoomIn = fns.zoomIn;
		this._zoomOut = fns.zoomOut;
		this._getZoomPercentage = fns.getZoomPercentage;
		this.isRegistered = true;
	}

	// Unregister (called by ImageViewer on unmount)
	unregister() {
		this._fitToWindow = null;
		this._actualSize = null;
		this._zoomIn = null;
		this._zoomOut = null;
		this._getZoomPercentage = null;
		this.isRegistered = false;
		this.zoomPercentage = 100;
	}

	// Update zoom percentage (called by ImageViewer after zoom changes)
	updateZoom(percentage: number) {
		this.zoomPercentage = percentage;
	}

	// Public methods (called by Toolbar)
	fitToWindow() {
		this._fitToWindow?.();
	}

	actualSize() {
		this._actualSize?.();
	}

	zoomIn() {
		this._zoomIn?.();
	}

	zoomOut() {
		this._zoomOut?.();
	}
}

// Singleton
let instance: ViewerControls | null = null;

export function getViewerControls(): ViewerControls {
	if (!instance) {
		instance = new ViewerControls();
	}
	return instance;
}
