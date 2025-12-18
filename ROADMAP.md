# Kahveci View - Modern Image Viewer & Editor Roadmap

> An IrfanView alternative built with Tauri 2, Svelte 5, and Rust

## 🎯 Project Vision

Create a fast, lightweight, cross-platform image viewer and editor that combines the simplicity of IrfanView with modern UI/UX and extensibility.

## 📊 Current Progress Status

**Phase 1: COMPLETED ✅ | Phase 2: COMPLETED ✅ | Phase 3: IN PROGRESS 🚀**

**Latest Achievement**: WebGL rendering migration with GPU acceleration, full feature parity, and seamless integration with toolbar, status bar, and navigation systems

---

## 🗓️ Development Phases

## Phase 1: Foundation & Core Viewing (COMPLETED ✅)

**Goal**: Basic image viewer functionality with modern UI

### 1.1 Project Architecture & File System

- [x] Tauri 2 + Svelte 5 + SvelteKit setup
- [x] File system permissions and dialog integration
- [x] File path validation and security checks
- [x] File metadata extraction (name, size, extension, date)

### 1.2 Basic Image Display

- [x] Image loading with Tauri asset protocol
- [x] Responsive image display with proper scaling
- [x] Loading states and comprehensive error handling
- [x] Support for common formats (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG)

### 1.3 Modern UI Layout

- [x] Three-tier layout (Toolbar + Content + StatusBar)
- [x] Professional toolbar with file operations
- [x] Status bar with file metadata and real-time updates
- [x] Default state with drag & drop placeholder
- [x] Emoji-based icons and modern design

### 1.4 Logging & Debugging

- [x] Comprehensive logging system with runtime controls
- [x] Debug utilities and performance monitoring
- [x] Error tracking and user feedback
- [x] Cross-layer performance instrumentation for file loading, navigation, decoding, and WebGL rendering

**Deliverable**: ✅ Functional image viewer with professional UI

---

## Phase 2: Design System & Polish (COMPLETED ✅)

**Goal**: Professional design system and code quality

### 2.1 Tailwind CSS Integration

- [x] Tailwind CSS v4.1 setup with Vite integration
- [x] Sophisticated OKLCH color system implementation
- [x] Mulish font integration for professional typography
- [x] Advanced shadow system and spacing architecture

### 2.2 Component Migration & Code Quality

- [x] All components migrated to Tailwind utilities
- [x] Multi-line class formatting for readability
- [x] Complete elimination of custom CSS files
- [x] Consistent utility-first approach
- [x] Performance optimized with CSS purging

### 2.3 Documentation & Standards

- [x] Comprehensive technical implementation history
- [x] Architectural decision documentation
- [x] Code quality standards and patterns

### 2.4 Professional Icon System

- [x] Migration from emoji to professional SVG icons
- [x] Lucide Svelte integration for Svelte compatibility
- [x] Centralized icon management system
- [x] Consistent visual design language

### 2.5 Tailwind v4 @theme Migration & Semantic Utility System

- [x] OKLCH color space for perceptual uniformity
- [x] 10-color semantic design system
- [x] Subtle component separation and reduced eye strain
- [x] Enhanced typography hierarchy and visual polish
- [x] Professional modern design competitive with premium apps
- [x] **Complete Tailwind v4 @theme directive implementation**
- [x] **Proper CSS-based color utility generation replacing JavaScript config**
- [x] **Clean semantic class names (bg-brand-dark) instead of arbitrary values**
- [x] **HSL function format correction for proper color rendering**
- [x] **Comprehensive layout background inheritance system**

**Deliverable**: ✅ Production-ready design system with proper Tailwind v4 implementation, semantic utility generation, and excellent maintainability

### 2.6 Custom Window Management System

- [x] Custom titlebar implementation with decorations disabled
- [x] Professional window control buttons (minimize, maximize, close)
- [x] Custom window dragging using Rust start_drag command
- [x] Window overlay configuration for macOS integration
- [x] Accessibility-compliant toolbar with proper ARIA labels
- [x] Hover states and visual feedback for all window controls
- [x] **Unique hybrid design**: macOS traffic light aesthetics with Windows-style right positioning
- [x] **Perfect button ordering**: Minimize, Maximize, Close (Windows convention)
- [x] **Creative styling fusion**: Best of both operating systems in one design

**Deliverable**: ✅ Unique hybrid window management combining macOS traffic light beauty with Windows positioning

### 2.7 Semantic Traffic Light Color System

- [x] **Tailwind v4 @theme Integration**: Proper CSS custom properties in centralized theme
- [x] **Refined Color Palette**: Professional HSL colors for elegant appearance
  - Red: `hsl(5 79% 65%)` - Sophisticated coral for close button
  - Yellow: `hsl(41 88% 63%)` - Elegant golden for minimize button
  - Green: `hsl(113 51% 56%)` - Modern fresh green for maximize button
- [x] **Complete Hover System**: Darker hover states and proper text colors
- [x] **Semantic Class Names**: Clean `bg-traffic-red` instead of arbitrary values
- [x] **Maintainable Architecture**: Centralized color management with type safety
- [x] **Visual Harmony**: Colors designed to work elegantly with dark theme

**Deliverable**: ✅ Professional coordinate tracking system with accurate real-time metadata display and refined window interaction behavior

### 2.11 Advanced Image Coordinate System & Status Bar Integration

- [x] **Original Image Pixel Coordinate Tracking**: Scale display coordinates to original image dimensions
- [x] **Shared Image Metadata Store**: Centralized store using Svelte 5 runes for cross-component data sharing
- [x] **Real-time Status Bar Data**: Display actual image dimensions, calculated ratios, and precise megapixel counts
- [x] **Window Drag Behavior Refinement**: Prevent UI element interference with window dragging
- [x] **Professional Metadata Calculations**: GCD-based aspect ratios, accurate megapixel computation
- [x] **Cross-Component Integration**: Seamless data flow between ImageViewer and StatusBar

**Deliverable**: ✅ Industry-standard coordinate system and authentic metadata display

---

## Phase 2.5: Enhanced Image System & Performance (COMPLETED ✅)

**Goal**: Advanced image rendering with GPU acceleration and professional coordinate system

### 2.5.1 Professional Image Coordinate System

- [x] Real image coordinate tracking instead of mock data
- [x] Accurate pixel coordinate mapping to original image dimensions
- [x] Shared image metadata stores using Svelte 5 runes
- [x] Real-time coordinate display with original pixel accuracy
- [x] Automatic image metadata calculation (resolution, aspect ratio, megapixels)

### 2.5.2 Canvas-Based Rendering System

- [x] Replace img element with canvas for GPU-accelerated rendering
- [x] Canvas 2D context with high-quality image smoothing
- [x] Device pixel ratio support for crisp display on high-DPI screens
- [x] Performance optimizations: alpha disabled, desynchronized rendering
- [x] Proper coordinate scaling between canvas display and original image

### 2.5.3 Development & Testing Features

- [x] Auto-load test image functionality for rapid development (optional via env var)
- [x] Env-controlled preview mode tuning (off/aggressive/progressive) for large-image navigation performance
- [x] Explicit progressive preview stage1/stage2 logging to validate upgrade scheduling and completion
- [x] Comprehensive canvas rendering logging and debugging
- [x] Real-time canvas resize handling with window changes

**Deliverable**: ✅ High-performance canvas-based image rendering with GPU acceleration and professional coordinate tracking

---

## Phase 3: Advanced Viewing & Navigation (IN PROGRESS 🚀)

**Goal**: Enhanced viewing capabilities and image navigation

### 3.1 Zoom & Pan System (COMPLETED ✅)

- [x] Zoom state management with Svelte 5 runes
- [x] Zoom in/out controls in toolbar with smooth animated transitions
- [x] Fit-to-window and actual size (100%) modes with smooth animations
- [x] Pinch-to-zoom and Cmd+scroll zoom (zoom-to-cursor like Apple Preview)
- [x] Trackpad scroll for panning (vertical and horizontal)
- [x] Pan with mouse drag for zoomed images
- [x] Zoom level display in status bar (real-time percentage)
- [x] Boundary clamping (image edges can't go past viewport)
- [x] Cursor feedback (grab/grabbing for pan, crosshair for normal)
- [x] Smooth eased animations (ease-out cubic, 250ms duration)
- [x] Command-based toolbar communication for animated transitions

### 3.2 Image Navigation (COMPLETED ✅)

- [x] Previous/Next image navigation in folder
- [x] Arrow key keyboard navigation (Left/Right arrows)
- [x] Jump to first/last image (Home/End keys)
- [x] Navigation position indicator in status bar ("3 / 25")
- [x] Adjacent image preloading for instant navigation
- [x] Folder scanning with alphabetical sorting
- [ ] Thumbnail strip for quick navigation (deferred to Phase 4)

### 3.2.5 WebGL Rendering Migration (COMPLETED ✅)

- [x] Standalone WebGLRenderer class for GPU-accelerated rendering
- [x] Step-by-step implementation (render → zoom → pan → zoom-to-cursor → animations)
- [x] Full feature parity with Canvas 2D implementation
- [x] Pinch-to-zoom with natural sensitivity tuning
- [x] Zoom-to-cursor behavior (point under cursor stays fixed)
- [x] Scroll panning and mouse drag panning
- [x] Smooth animated transitions for toolbar controls
- [x] Mouse coordinate tracking for status bar display
- [x] Image caching integration with crossOrigin support
- [x] Toolbar button re-integration via viewerControls store
- [x] Status bar zoom percentage display
- [x] Navigation system compatibility
- [x] Old Canvas 2D implementation preserved as ImageViewer.old.svelte

### 3.3 Full-Screen & Presentation

- [ ] Full-screen viewing mode
- [ ] Slideshow mode with configurable timing
- [ ] Presentation controls (play/pause/stop)
- [ ] Transition effects between images
- [ ] Exit full-screen with ESC key

### 3.4 Advanced Image Handling

- [x] Rotation (90°, 180°, 270°)
- [x] Flip horizontal/vertical (non-destructive)
- [x] Animated rotate/flip transitions
- [x] Zoom button actions preserve current framing (no auto-centering)
- [ ] Support for animated GIF/WebP playback
- [ ] EXIF data reading and display
- [ ] Image properties panel with metadata

**Deliverable**: Feature-rich viewer with professional navigation

---

## Phase 4: File Management & Organization

**Goal**: Comprehensive file and folder management

### 4.1 Folder Navigation

- [ ] Folder tree browser in sidebar
- [ ] Recent folders and favorites
- [ ] Breadcrumb navigation
- [ ] Folder watching for live updates

### 4.2 File Operations

- [ ] Copy/Move/Delete operations with confirmation
- [ ] Rename with validation
- [x] File association management for "Open with" (open images on double-click)
- [ ] Drag & drop support for files and folders
- [ ] Multiple file selection

### 4.3 Thumbnail Browser

- [ ] Grid view with configurable thumbnail sizes
- [ ] Fast thumbnail generation and caching
- [ ] Quick preview on hover
- [ ] Sort by name, date, size, or type
- [ ] Filter by image format

### 4.4 Search & Organization

- [ ] Search by filename or metadata
- [ ] Basic tagging system
- [ ] Favorites/bookmarks for images
- [ ] Recently viewed images list

**Deliverable**: Complete file management solution

---

## Phase 5: Basic Editing & Export

**Goal**: Essential non-destructive editing capabilities

### 5.1 Non-Destructive Editing Foundation

- [ ] Edit history system with undo/redo
- [ ] Preview system for edits
- [ ] Save vs Save As with format options
- [ ] Edit state management

### 5.2 Basic Editing Tools

- [ ] Crop tool with aspect ratio presets
- [ ] Resize with quality settings
- [ ] Brightness/Contrast adjustments
- [ ] Saturation/Hue modifications
- [ ] Sharpen/Blur filters

### 5.3 Export & Conversion

- [ ] Format conversion (JPEG, PNG, WebP, etc.)
- [ ] Quality/compression settings
- [ ] Batch export for multiple images
- [ ] Export with metadata preservation

### 5.4 Print Support

- [ ] Print preview with scaling options
- [ ] Page layout and margins
- [ ] Print quality settings

**Deliverable**: Image viewer with basic editing capabilities

---

## Phase 6: Performance & Advanced Features

**Goal**: Professional-grade performance and advanced functionality

### 6.1 Performance Optimization

- [x] GPU texture caching for already-viewed images in WebGL renderer
- [x] GPU prewarming for adjacent images to hide first upload latency
- [x] Throttled GPU prewarming queue (one upload at a time) for smoother UI
- [x] Protected current texture from GPU cache eviction
- [x] Validation logs for prewarm queue + GPU cache eviction decisions (structured JSON visible in terminal)
- [x] Navigation openFileByPath requestId guard to prevent out-of-order file opens on rapid navigation
- [x] ImageBitmap-based decode cache (async) + display-size downscaled textures for faster first visits
- [x] Full-res texture upgrade auto-triggered after first render (debounced/idle) with status bar loading indicator (keep downscaled image visible until ready; status bar metadata/coords stay in original pixel space)
- [x] Skip full-res upgrade for small/medium images when preview decode is already full resolution (avoid upscaling on preview decode)
- [x] Reduce post-navigation jank by deferring GPU prewarm and auto full-res upgrade further into idle time
- [ ] Image caching system for faster loading
- [ ] Memory management for large files
- [ ] Background thumbnail generation
- [ ] Lazy loading optimization
- [ ] GPU acceleration where possible

### 6.2 Advanced Image Support

- [ ] RAW format support (CR2, NEF, ARW, etc.)
- [ ] HEIC/HEIF format support
- [ ] PSD file basic support
- [ ] Multi-page TIFF support
- [ ] PDF page viewing

### 6.3 Professional Tools

- [ ] Color profile management
- [ ] Histogram display
- [ ] Focus peaking for sharp areas
- [ ] Image comparison (side-by-side)
- [ ] Dual monitor support

### 6.4 Batch Processing

- [ ] Batch resize and format conversion
- [ ] Batch rename with patterns
- [ ] Batch metadata editing
- [ ] Progress tracking for long operations

**Deliverable**: Professional-grade image viewer and processor

---

## Phase 7: Modern Integrations & AI Features

**Goal**: Modern features and intelligent automation

### 7.1 Cloud Integration

- [ ] Google Drive/OneDrive/Dropbox integration
- [ ] Cloud sync for settings and favorites
- [ ] Remote image viewing
- [ ] Shared image collections

### 7.2 AI-Powered Features

- [ ] Auto-tagging with AI recognition
- [ ] Smart cropping suggestions
- [ ] Object detection and removal
- [ ] Image upscaling with AI
- [ ] Automatic organization by content

### 7.3 Collaboration Features

- [ ] Image sharing with secure links
- [ ] Annotation and comment system
- [ ] Version history for edited images
- [ ] Team workspaces

**Deliverable**: Modern, AI-enhanced image management platform

---

## Phase 8: Platform Integration & Distribution

**Goal**: Native platform integration and professional distribution

### 8.1 Platform Integration

- [x] System file association management
- [ ] Context menu integration (right-click to open)
- [ ] Thumbnail generation for OS file managers
- [ ] System notifications
- [ ] Global keyboard shortcuts

### 8.2 Customization & Accessibility

- [ ] Theme system (light/dark/custom)
- [ ] Customizable keyboard shortcuts
- [ ] UI layout customization
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Multi-language support

### 8.3 Quality Assurance & Distribution

- [ ] Comprehensive automated testing
- [ ] Performance benchmarking
- [ ] Cross-platform compatibility testing
- [ ] Security audit and code signing
- [ ] Auto-updater system

### 8.4 Documentation & Community

- [ ] User manual and help system
- [ ] Video tutorials and getting started guide
- [ ] Plugin development API
- [ ] Community website and support

**Deliverable**: Production-ready application ready for distribution

---

## 🛠️ Technology Stack

### Frontend

- **Framework**: Svelte 5 with runes
- **Build Tool**: SvelteKit + Vite
- **Styling**: Tailwind CSS v4.1 with custom design system
- **State Management**: Svelte 5 runes with custom stores
- **Typography**: Mulish Google Font
- **Rendering**: WebGL for GPU-accelerated image rendering

### Backend (Rust)

- **Framework**: Tauri 2
- **Image Processing**: `image` crate, `imageproc`
- **File System**: Tauri filesystem API with capabilities
- **Performance**: `rayon` for parallelization
- **Serialization**: `serde`

---

## 📊 Success Metrics

### Performance Targets

- [ ] Startup time < 2 seconds
- [ ] Image load time < 500ms for typical photos
- [ ] Memory usage < 200MB idle, < 1GB with large images
- [ ] Smooth 60fps UI interactions

### Feature Completion

- [ ] Support for 25+ image formats
- [ ] 50+ keyboard shortcuts
- [ ] 15+ editing tools
- [ ] Cross-platform compatibility (Windows, macOS, Linux)

### User Experience

- [ ] Intuitive UI requiring minimal learning
- [ ] Professional design with consistent 4-color palette
- [ ] Accessibility compliance
- [ ] Comprehensive help system

---

## 🚀 Next Steps

### **Current Status**: Phase 3.2.5 Complete ✅ - WebGL Rendering Migration

**Last Achievement**: WebGL GPU-accelerated rendering with full feature parity, smooth animations, zoom-to-cursor, and complete integration with existing systems

### **Immediate Next Task (3.3)**: Full-Screen & Presentation

**Goal**: Add full-screen viewing and slideshow modes

**Steps**:

1. Implement full-screen toggle (F11 or button)
2. Add slideshow mode with configurable timing
3. Presentation controls (play/pause/stop)
4. Exit full-screen with ESC key

### **This Week's Target**: Complete Phase 3.3 (Full-Screen & Presentation)

**Estimated Time**: 2-3 hours  
**Outcome**: Professional presentation and slideshow capabilities

### **Next Sprint Goal**: Complete Phase 3 (Advanced Viewing & Navigation)

**Outcome**: Feature-complete image viewer with navigation and presentation modes

---

_Last Updated: December 5, 2025_  
_Current Phase: Phase 3 - Advanced Viewing & Navigation (3.1, 3.2, 3.2.5 Complete) 🚀_
