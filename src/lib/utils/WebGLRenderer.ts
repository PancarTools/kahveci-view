import { logger } from "$lib/utils/logger";

/**
 * WebGLRenderer - Standalone WebGL image renderer
 *
 * This class handles all WebGL operations imperatively.
 * NO Svelte reactivity - call methods directly when needed.
 */

// Vertex shader - positions a quad and passes texture coordinates
const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;
uniform float u_scale;
uniform vec2 u_offset;
uniform vec2 u_imageSize;
uniform int u_rotation;
uniform vec2 u_flip;

varying vec2 v_texCoord;

void main() {
    // Scale image coordinates by image size, then apply zoom scale and offset
    vec2 position = a_position * u_imageSize * u_scale + u_offset;
    
    // Convert to clip space (-1 to 1)
    vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
    
    // Flip Y axis (WebGL has Y up, we want Y down)
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    
    vec2 uv = a_texCoord;
    if (u_flip.x > 0.5) {
        uv.x = 1.0 - uv.x;
    }
    if (u_flip.y > 0.5) {
        uv.y = 1.0 - uv.y;
    }

    // Rotate in 90-degree clockwise steps
    if (u_rotation == 1) {
        uv = vec2(uv.y, 1.0 - uv.x);
    } else if (u_rotation == 2) {
        uv = vec2(1.0 - uv.x, 1.0 - uv.y);
    } else if (u_rotation == 3) {
        uv = vec2(1.0 - uv.y, uv.x);
    }

    v_texCoord = uv;
}
`;

// Fragment shader - samples the texture
const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_image;

varying vec2 v_texCoord;

void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
}
`;

type LoadImageOptions = {
	forceUpload?: boolean;
	preserveImageSize?: boolean;
};

export class WebGLRenderer {
	private webGLCtx: WebGLRenderingContext | null = null;
	private program: WebGLProgram | null = null;
	private texture: WebGLTexture | null = null;
	private positionBuffer: WebGLBuffer | null = null;
	private texCoordBuffer: WebGLBuffer | null = null;
	private textureCache: Map<string, WebGLTexture> = new Map();
	private maxTextureCacheSize = 8;
	private currentTextureKey: string | null = null;

	// Uniform locations
	private u_resolution: WebGLUniformLocation | null = null;
	private u_scale: WebGLUniformLocation | null = null;
	private u_offset: WebGLUniformLocation | null = null;
	private u_imageSize: WebGLUniformLocation | null = null;
	private u_rotation: WebGLUniformLocation | null = null;
	private u_flip: WebGLUniformLocation | null = null;

	// Attribute locations
	private a_position: number = -1;
	private a_texCoord: number = -1;

	// State
	private canvasWidth = 0;
	private canvasHeight = 0;
	private imageWidth = 0;
	private imageHeight = 0;
	private baseImageWidth = 0;
	private baseImageHeight = 0;
	private rotation = 0;
	private flipX = false;
	private flipY = false;
	private isInitialized = false;

	/**
	 * Initialize WebGL context and compile shaders
	 */
	init(canvas: HTMLCanvasElement): boolean {
		console.log("[WebGLRenderer] Initializing...");

		// Get WebGL context
		this.webGLCtx = canvas.getContext("webgl", {
			alpha: true,
			antialias: false,
			premultipliedAlpha: false,
			preserveDrawingBuffer: true, // Required for readPixels() to work reliably
		});

		if (!this.webGLCtx) {
			console.error("[WebGLRenderer] Failed to get WebGL context");
			return false;
		}

		const gl = this.webGLCtx;

		// Compile shaders
		const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
		const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

		if (!vertexShader || !fragmentShader) {
			return false;
		}

		// Create and link program
		this.program = this.createProgram(gl, vertexShader, fragmentShader);
		if (!this.program) {
			return false;
		}

		// Get attribute locations
		this.a_position = gl.getAttribLocation(this.program, "a_position");
		this.a_texCoord = gl.getAttribLocation(this.program, "a_texCoord");

		// Get uniform locations
		this.u_resolution = gl.getUniformLocation(this.program, "u_resolution");
		this.u_scale = gl.getUniformLocation(this.program, "u_scale");
		this.u_offset = gl.getUniformLocation(this.program, "u_offset");
		this.u_imageSize = gl.getUniformLocation(this.program, "u_imageSize");
		this.u_rotation = gl.getUniformLocation(this.program, "u_rotation");
		this.u_flip = gl.getUniformLocation(this.program, "u_flip");

		// Create buffers
		this.positionBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();

		// Set up position buffer (unit quad: 0,0 to 1,1)
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);

		// Set up texture coordinate buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);

		this.isInitialized = true;
		console.log("[WebGLRenderer] Initialized successfully");
		return true;
	}

	/**
	 * Resize the renderer to match canvas size
	 */
	resize(width: number, height: number, dpr: number = 1): void {
		if (!this.webGLCtx) return;

		this.canvasWidth = width;
		this.canvasHeight = height;

		// Set viewport to match canvas internal size
		this.webGLCtx.viewport(0, 0, width * dpr, height * dpr);

		console.log(`[WebGLRenderer] Resized to ${width}x${height} (dpr: ${dpr})`);
	}

	/**
	 * Load an image as a texture
	 */
	loadImage(img: TexImageSource, key: string, options?: LoadImageOptions): boolean {
		if (!this.webGLCtx) {
			console.error("[WebGLRenderer] Cannot load image - not initialized");
			return false;
		}

		const gl = this.webGLCtx;
		const forceUpload = options?.forceUpload ?? false;
		const preserveImageSize = options?.preserveImageSize ?? false;
		const tStart = performance.now();

		// Try cached texture first
		const cachedTexture = this.textureCache.get(key);
		if (cachedTexture && !forceUpload) {
			gl.bindTexture(gl.TEXTURE_2D, cachedTexture);
			this.texture = cachedTexture;
			this.currentTextureKey = key;
			const size = this.getSourceSize(img);
			this.baseImageWidth = size?.width ?? this.baseImageWidth;
			this.baseImageHeight = size?.height ?? this.baseImageHeight;
			this.updateDisplayedSize();

			const tEnd = performance.now();
			logger.info(`loadImage cache hit in ${(tEnd - tStart).toFixed(1)}ms`, "PERF/WebGL", {
				key,
				currentTextureKey: this.currentTextureKey,
				width: this.imageWidth,
				height: this.imageHeight,
				cached: true,
				cacheSize: this.textureCache.size,
			});
			return true;
		}

		if (cachedTexture && forceUpload) {
			gl.deleteTexture(cachedTexture);
			this.textureCache.delete(key);
		}

		// No cached texture for this key - upload a new one
		const texture = gl.createTexture();
		if (!texture) {
			console.error("[WebGLRenderer] Failed to create texture");
			return false;
		}

		gl.bindTexture(gl.TEXTURE_2D, texture);

		// Set texture parameters for non-power-of-2 images
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		const tUploadStart = performance.now();
		// Upload image to GPU
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		const tUploadEnd = performance.now();

		const size = this.getSourceSize(img);
		if (!preserveImageSize || this.imageWidth === 0 || this.imageHeight === 0) {
			this.baseImageWidth = size?.width ?? this.baseImageWidth;
			this.baseImageHeight = size?.height ?? this.baseImageHeight;
			this.updateDisplayedSize();
		}

		// Track as current texture and add to cache
		this.texture = texture;
		this.currentTextureKey = key;
		this.textureCache.set(key, texture);

		// Enforce a simple FIFO cache to avoid unbounded GPU memory growth
		this.evictOneTexture(key);

		const tEnd = performance.now();
		console.log(`[WebGLRenderer] Image loaded: ${this.imageWidth}x${this.imageHeight}`);
		logger.info(
			`loadImage total ${(tEnd - tStart).toFixed(1)}ms, texImage2D ${(tUploadEnd - tUploadStart).toFixed(1)}ms`,
			"PERF/WebGL",
			{
				key,
				currentTextureKey: this.currentTextureKey,
				width: this.imageWidth,
				height: this.imageHeight,
				cached: false,
				forceUpload,
				preserveImageSize,
				cacheSize: this.textureCache.size,
			},
		);
		return true;
	}

	prewarmTexture(img: TexImageSource, key: string): void {
		if (!this.webGLCtx) return;

		if (this.textureCache.has(key)) {
			logger.debug("prewarmTexture skipped (already cached)", "PERF/WebGL", {
				key,
				currentTextureKey: this.currentTextureKey,
				cacheSize: this.textureCache.size,
			});
			return;
		}

		const gl = this.webGLCtx;
		const tStart = performance.now();

		const texture = gl.createTexture();
		if (!texture) {
			console.error("[WebGLRenderer] Failed to create texture during prewarm");
			return;
		}

		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		const tUploadStart = performance.now();
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		const tUploadEnd = performance.now();

		this.textureCache.set(key, texture);
		this.evictOneTexture(key);

		const tEnd = performance.now();
		const size = this.getSourceSize(img);
		logger.info(
			`prewarmTexture total ${(tEnd - tStart).toFixed(1)}ms, texImage2D ${(tUploadEnd - tUploadStart).toFixed(1)}ms`,
			"PERF/WebGL",
			{
				key,
				currentTextureKey: this.currentTextureKey,
				width: size?.width ?? null,
				height: size?.height ?? null,
				prewarm: true,
				cacheSize: this.textureCache.size,
			},
		);
	}

	/**
	 * Render the image
	 * @param scale - Zoom level (1.0 = 100%)
	 * @param offsetX - Horizontal offset in pixels
	 * @param offsetY - Vertical offset in pixels
	 */
	render(scale: number, offsetX: number, offsetY: number): void {
		if (!this.webGLCtx || !this.program || !this.texture) {
			return;
		}

		const gl = this.webGLCtx;

		// Clear with dark background
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(this.program);

		// Set uniforms
		gl.uniform2f(this.u_resolution, this.canvasWidth, this.canvasHeight);
		gl.uniform1f(this.u_scale, scale);
		gl.uniform2f(this.u_offset, offsetX, offsetY);
		gl.uniform2f(this.u_imageSize, this.imageWidth, this.imageHeight);
		if (this.u_rotation) {
			gl.uniform1i(this.u_rotation, this.rotation);
		}
		if (this.u_flip) {
			gl.uniform2f(this.u_flip, this.flipX ? 1 : 0, this.flipY ? 1 : 0);
		}

		// Bind position buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.enableVertexAttribArray(this.a_position);
		gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

		// Bind texture coordinate buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.enableVertexAttribArray(this.a_texCoord);
		gl.vertexAttribPointer(this.a_texCoord, 2, gl.FLOAT, false, 0, 0);

		// Bind texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// Draw
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	/**
	 * Get image dimensions
	 */
	getImageSize(): { width: number; height: number } {
		return { width: this.imageWidth, height: this.imageHeight };
	}

	getTransform(): { rotation: number; flipX: boolean; flipY: boolean } {
		return { rotation: this.rotation, flipX: this.flipX, flipY: this.flipY };
	}

	setTransform(rotation: number, flipX: boolean, flipY: boolean): void {
		this.rotation = ((rotation % 4) + 4) % 4;
		this.flipX = flipX;
		this.flipY = flipY;
		this.updateDisplayedSize();
	}

	resetTransform(): void {
		this.rotation = 0;
		this.flipX = false;
		this.flipY = false;
		this.updateDisplayedSize();
	}

	/**
	 * Get canvas dimensions
	 */
	getCanvasSize(): { width: number; height: number } {
		return { width: this.canvasWidth, height: this.canvasHeight };
	}

	/**
	 * Sample a single pixel from the rendered framebuffer
	 */
	samplePixel(x: number, y: number): { r: number; g: number; b: number; a: number } | null {
		if (!this.webGLCtx) return null;

		const gl = this.webGLCtx;
		const pixelData = new Uint8Array(4);

		try {
			gl.flush();
			gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

			const error = gl.getError();
			if (error !== gl.NO_ERROR) {
				console.warn(`[WebGLRenderer] readPixels error: ${error}`);
				return null;
			}

			return {
				r: pixelData[0],
				g: pixelData[1],
				b: pixelData[2],
				a: pixelData[3],
			};
		} catch (e) {
			console.error("[WebGLRenderer] Failed to sample pixel:", e);
			return null;
		}
	}

	/**
	 * Check if renderer is ready
	 */
	isReady(): boolean {
		return this.isInitialized && this.webGLCtx !== null;
	}

	/**
	 * Check if an image is loaded
	 */
	hasImage(): boolean {
		return this.texture !== null;
	}

	/**
	 * Clean up WebGL resources
	 */
	destroy(): void {
		if (!this.webGLCtx) return;

		const gl = this.webGLCtx;

		for (const texture of this.textureCache.values()) {
			gl.deleteTexture(texture);
		}
		this.textureCache.clear();
		if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
		if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
		if (this.program) gl.deleteProgram(this.program);

		this.texture = null;
		this.currentTextureKey = null;
		this.baseImageWidth = 0;
		this.baseImageHeight = 0;
		this.imageWidth = 0;
		this.imageHeight = 0;
		this.rotation = 0;
		this.flipX = false;
		this.flipY = false;
		this.positionBuffer = null;
		this.texCoordBuffer = null;
		this.program = null;
		this.webGLCtx = null;
		this.isInitialized = false;

		console.log("[WebGLRenderer] Destroyed");
	}

	// === Private helpers ===

	private compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
		const shader = gl.createShader(type);
		if (!shader) return null;

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error("[WebGLRenderer] Shader compile error:", gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	private createProgram(
		gl: WebGLRenderingContext,
		vertexShader: WebGLShader,
		fragmentShader: WebGLShader,
	): WebGLProgram | null {
		const program = gl.createProgram();
		if (!program) return null;

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error("[WebGLRenderer] Program link error:", gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return null;
		}

		return program;
	}

	private evictOneTexture(protectedKey: string): void {
		if (!this.webGLCtx) return;
		if (this.textureCache.size <= this.maxTextureCacheSize) return;

		const gl = this.webGLCtx;
		const cacheSizeBefore = this.textureCache.size;
		let keyToEvict: string | null = null;

		for (const key of this.textureCache.keys()) {
			if (key === protectedKey) continue;
			if (this.currentTextureKey && key === this.currentTextureKey) continue;
			keyToEvict = key;
			break;
		}

		if (!keyToEvict) {
			logger.warn("GPU texture cache over capacity but no evictable key (current/protected only)", "PERF/WebGLCache", {
				cacheSizeBefore,
				maxTextureCacheSize: this.maxTextureCacheSize,
				protectedKey,
				currentTextureKey: this.currentTextureKey,
			});
			return;
		}

		const texture = this.textureCache.get(keyToEvict);
		if (texture) {
			gl.deleteTexture(texture);
		}
		this.textureCache.delete(keyToEvict);
		logger.info("Evicted GPU texture from cache", "PERF/WebGLCache", {
			cacheSizeBefore,
			cacheSizeAfter: this.textureCache.size,
			maxTextureCacheSize: this.maxTextureCacheSize,
			protectedKey,
			currentTextureKey: this.currentTextureKey,
			evictedKey: keyToEvict,
		});
	}

	private getSourceSize(source: TexImageSource): { width: number; height: number } | null {
		const anySource = source as any;
		if (typeof anySource?.naturalWidth === "number" && typeof anySource?.naturalHeight === "number") {
			return { width: anySource.naturalWidth, height: anySource.naturalHeight };
		}
		if (typeof anySource?.videoWidth === "number" && typeof anySource?.videoHeight === "number") {
			return { width: anySource.videoWidth, height: anySource.videoHeight };
		}
		if (typeof anySource?.width === "number" && typeof anySource?.height === "number") {
			return { width: anySource.width, height: anySource.height };
		}
		return null;
	}

	private updateDisplayedSize(): void {
		if (this.baseImageWidth <= 0 || this.baseImageHeight <= 0) return;
		const rot = this.rotation % 4;
		if (rot === 1 || rot === 3) {
			this.imageWidth = this.baseImageHeight;
			this.imageHeight = this.baseImageWidth;
		} else {
			this.imageWidth = this.baseImageWidth;
			this.imageHeight = this.baseImageHeight;
		}
	}
}
