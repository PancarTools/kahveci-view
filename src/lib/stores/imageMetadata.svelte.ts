// Image metadata store for sharing actual image dimensions and properties
// Tracks loaded image information for status bar display

class ImageMetadata {
	naturalWidth = $state(0);
	naturalHeight = $state(0);
	isLoaded = $state(false);

	setDimensions(width: number, height: number) {
		this.naturalWidth = width;
		this.naturalHeight = height;
		this.isLoaded = true;
	}

	reset() {
		this.naturalWidth = 0;
		this.naturalHeight = 0;
		this.isLoaded = false;
	}

	get resolution(): string {
		if (!this.isLoaded || this.naturalWidth === 0) return "—";
		return `${this.naturalWidth}x${this.naturalHeight}`;
	}

	get ratio(): string {
		if (!this.isLoaded || this.naturalWidth === 0 || this.naturalHeight === 0) return "—";

		// Calculate greatest common divisor to simplify ratio
		const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
		const divisor = gcd(this.naturalWidth, this.naturalHeight);
		const widthRatio = this.naturalWidth / divisor;
		const heightRatio = this.naturalHeight / divisor;

		return `${widthRatio}:${heightRatio}`;
	}

	get megapixels(): string {
		if (!this.isLoaded || this.naturalWidth === 0) return "—";
		const mp = (this.naturalWidth * this.naturalHeight) / 1000000;
		return `${mp.toFixed(1)}MP`;
	}
}

const DEFAULT_IMAGE_METADATA_KEY = Symbol("default_image_metadata_key");
export const imageMetadataStore = new Map<symbol, ImageMetadata>();

export function getImageMetadata(key: symbol = DEFAULT_IMAGE_METADATA_KEY): ImageMetadata {
	if (!imageMetadataStore.has(key)) {
		imageMetadataStore.set(key, new ImageMetadata());
	}
	return imageMetadataStore.get(key)!;
}
