export type ColorFormat = "rgb" | "hsl" | "hsv" | "oklab" | "oklch";

export interface RGB {
	r: number;
	g: number;
	b: number;
	a?: number;
}

export interface HSL {
	h: number;
	s: number;
	l: number;
	a?: number;
}

export interface HSV {
	h: number;
	s: number;
	v: number;
	a?: number;
}

export interface OKLab {
	l: number;
	a: number;
	b: number;
	alpha?: number;
}

export interface OKLch {
	l: number;
	c: number;
	h: number;
	alpha?: number;
}

export function rgbToHsl(rgb: RGB): HSL {
	const r = rgb.r / 255;
	const g = rgb.g / 255;
	const b = rgb.b / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	if (max === min) {
		return { h: 0, s: 0, l: Math.round(l * 100), a: rgb.a };
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h = 0;
	switch (max) {
		case r:
			h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
			break;
		case g:
			h = ((b - r) / d + 2) / 6;
			break;
		case b:
			h = ((r - g) / d + 4) / 6;
			break;
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
		a: rgb.a,
	};
}

export function rgbToHsv(rgb: RGB): HSV {
	const r = rgb.r / 255;
	const g = rgb.g / 255;
	const b = rgb.b / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	const s = max === 0 ? 0 : d / max;
	const v = max;

	let h = 0;
	if (max !== min) {
		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		v: Math.round(v * 100),
		a: rgb.a,
	};
}

function linearize(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function rgbToOklab(rgb: RGB): OKLab {
	const r = linearize(rgb.r / 255);
	const g = linearize(rgb.g / 255);
	const b = linearize(rgb.b / 255);

	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.0817845529 * g + 0.8943868922 * b;

	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);

	return {
		l: Math.round((0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_) * 100),
		a: Math.round((1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_) * 100),
		b: Math.round((0.0259040371 * l_ + 0.7827717662 * m_ - 0.808649671 * s_) * 100),
		alpha: rgb.a,
	};
}

export function rgbToOklch(rgb: RGB): OKLch {
	const oklab = rgbToOklab(rgb);
	const c = Math.sqrt(oklab.a ** 2 + oklab.b ** 2);
	let h = Math.atan2(oklab.b, oklab.a) * (180 / Math.PI);
	if (h < 0) h += 360;

	return {
		l: oklab.l,
		c: Math.round(c * 100),
		h: Math.round(h),
		alpha: rgb.a,
	};
}

export function formatColor(rgb: RGB, format: ColorFormat): string {
	switch (format) {
		case "rgb":
			return rgb.a !== undefined && rgb.a < 255
				? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(rgb.a / 255).toFixed(2)})`
				: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

		case "hsl": {
			const hsl = rgbToHsl(rgb);
			return hsl.a !== undefined && hsl.a < 255
				? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${(hsl.a / 255).toFixed(2)})`
				: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
		}

		case "hsv": {
			const hsv = rgbToHsv(rgb);
			return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
		}

		case "oklab": {
			const oklab = rgbToOklab(rgb);
			return `oklab(${(oklab.l / 100).toFixed(2)} ${(oklab.a / 100).toFixed(2)} ${(oklab.b / 100).toFixed(2)})`;
		}

		case "oklch": {
			const oklch = rgbToOklch(rgb);
			return `oklch(${(oklch.l / 100).toFixed(2)} ${(oklch.c / 100).toFixed(2)} ${oklch.h})`;
		}

		default:
			return "";
	}
}

export function getNextFormat(current: ColorFormat): ColorFormat {
	const formats: ColorFormat[] = ["rgb", "hsl", "hsv", "oklab", "oklch"];
	const index = formats.indexOf(current);
	return formats[(index + 1) % formats.length];
}

export function hexToRgb(hex: string): RGB | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null;
}

export function rgbToHex(rgb: RGB): string {
	const toHex = (n: number) => {
		const hex = n.toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};
	return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}
