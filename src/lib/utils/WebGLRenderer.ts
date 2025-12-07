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

varying vec2 v_texCoord;

void main() {
    // Scale image coordinates by image size, then apply zoom scale and offset
    vec2 position = a_position * u_imageSize * u_scale + u_offset;
    
    // Convert to clip space (-1 to 1)
    vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
    
    // Flip Y axis (WebGL has Y up, we want Y down)
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    
    v_texCoord = a_texCoord;
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

export class WebGLRenderer {
	private gl: WebGLRenderingContext | null = null;
	private program: WebGLProgram | null = null;
	private texture: WebGLTexture | null = null;
	private positionBuffer: WebGLBuffer | null = null;
	private texCoordBuffer: WebGLBuffer | null = null;

	// Uniform locations
	private u_resolution: WebGLUniformLocation | null = null;
	private u_scale: WebGLUniformLocation | null = null;
	private u_offset: WebGLUniformLocation | null = null;
	private u_imageSize: WebGLUniformLocation | null = null;

	// Attribute locations
	private a_position: number = -1;
	private a_texCoord: number = -1;

	// State
	private canvasWidth = 0;
	private canvasHeight = 0;
	private imageWidth = 0;
	private imageHeight = 0;
	private isInitialized = false;

	/**
	 * Initialize WebGL context and compile shaders
	 */
	init(canvas: HTMLCanvasElement): boolean {
		console.log("[WebGLRenderer] Initializing...");

		// Get WebGL context
		this.gl = canvas.getContext("webgl", {
			alpha: false,
			antialias: false,
			premultipliedAlpha: false,
			preserveDrawingBuffer: false,
		});

		if (!this.gl) {
			console.error("[WebGLRenderer] Failed to get WebGL context");
			return false;
		}

		const gl = this.gl;

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
		if (!this.gl) return;

		this.canvasWidth = width;
		this.canvasHeight = height;

		// Set viewport to match canvas internal size
		this.gl.viewport(0, 0, width * dpr, height * dpr);

		console.log(`[WebGLRenderer] Resized to ${width}x${height} (dpr: ${dpr})`);
	}

	/**
	 * Load an image as a texture
	 */
	loadImage(img: HTMLImageElement): boolean {
		if (!this.gl) {
			console.error("[WebGLRenderer] Cannot load image - not initialized");
			return false;
		}

		const gl = this.gl;

		// Delete old texture if exists
		if (this.texture) {
			gl.deleteTexture(this.texture);
		}

		// Create new texture
		this.texture = gl.createTexture();
		if (!this.texture) {
			console.error("[WebGLRenderer] Failed to create texture");
			return false;
		}

		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// Set texture parameters for non-power-of-2 images
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		// Upload image to GPU
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

		this.imageWidth = img.naturalWidth;
		this.imageHeight = img.naturalHeight;

		console.log(`[WebGLRenderer] Image loaded: ${this.imageWidth}x${this.imageHeight}`);
		return true;
	}

	/**
	 * Render the image
	 * @param scale - Zoom level (1.0 = 100%)
	 * @param offsetX - Horizontal offset in pixels
	 * @param offsetY - Vertical offset in pixels
	 */
	render(scale: number, offsetX: number, offsetY: number): void {
		if (!this.gl || !this.program || !this.texture) {
			return;
		}

		const gl = this.gl;

		// Clear with dark background
		gl.clearColor(0.078, 0.086, 0.094, 1.0); // hsl(220, 8%, 8%)
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(this.program);

		// Set uniforms
		gl.uniform2f(this.u_resolution, this.canvasWidth, this.canvasHeight);
		gl.uniform1f(this.u_scale, scale);
		gl.uniform2f(this.u_offset, offsetX, offsetY);
		gl.uniform2f(this.u_imageSize, this.imageWidth, this.imageHeight);

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

	/**
	 * Get canvas dimensions
	 */
	getCanvasSize(): { width: number; height: number } {
		return { width: this.canvasWidth, height: this.canvasHeight };
	}

	/**
	 * Check if renderer is ready
	 */
	isReady(): boolean {
		return this.isInitialized && this.gl !== null;
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
		if (!this.gl) return;

		const gl = this.gl;

		if (this.texture) gl.deleteTexture(this.texture);
		if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
		if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
		if (this.program) gl.deleteProgram(this.program);

		this.texture = null;
		this.positionBuffer = null;
		this.texCoordBuffer = null;
		this.program = null;
		this.gl = null;
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
		fragmentShader: WebGLShader
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
}
