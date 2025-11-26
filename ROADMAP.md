# Kahveci View - Modern Image Viewer & Editor Roadmap

> An IrfanView alternative built with Tauri 2, Svelte 5, and Rust

## 🎯 Project Vision

Create a fast, lightweight, cross-platform image viewer and editor that combines the simplicity of IrfanView with modern UI/UX and extensibility.

## 📋 Feature Comparison with IrfanView

### Core Features to Match

- [ ] Fast image viewing (all major formats)
- [ ] Basic image editing (resize, rotate, crop, color adjustments)
- [ ] Batch processing
- [ ] Slideshow mode
- [ ] Thumbnail browser
- [ ] File management integration
- [ ] Plugin system
- [ ] Multiple format support (100+ formats)

### Modern Enhancements

- [ ] Modern, responsive UI
- [ ] Dark/Light theme support
- [ ] Touch/gesture support
- [ ] Cloud storage integration
- [ ] Real-time collaboration
- [ ] Advanced metadata editing
- [ ] Vector graphics support
- [ ] AI-powered features

---

## 🗓️ Development Phases

## Phase 1: Foundation (Weeks 1-2)

**Goal**: Basic image viewer functionality

### 1.1 Project Architecture Setup ✅

- [x] Tauri 2 + Svelte 5 + SvelteKit setup
- [x] TypeScript configuration
- [x] Basic routing structure
- [x] State management with Svelte 5 runes

### 1.2 File System Foundation (Week 1, Days 1-2)

- [ ] **1.2.1** Setup Tauri filesystem permissions in `tauri.conf.json`
- [ ] **1.2.2** Create file dialog integration (open file)
- [ ] **1.2.3** Add file path validation and error handling
- [ ] **1.2.4** Create basic file info extraction (name, size, extension)
- [ ] **1.2.5** Test file selection with common image formats

### 1.3 Basic Image Display (Week 1, Days 3-4)

- [ ] **1.3.1** Create ImageViewer component structure
- [ ] **1.3.2** Implement image loading from file path
- [ ] **1.3.3** Add basic image display with proper scaling
- [ ] **1.3.4** Handle image loading errors gracefully
- [ ] **1.3.5** Add loading spinner/placeholder

### 1.4 Simple Zoom (Week 1, Days 5-6)

- [ ] **1.4.1** Add zoom state management (zoom level store)
- [ ] **1.4.2** Implement zoom in/out buttons
- [ ] **1.4.3** Add fit-to-window mode
- [ ] **1.4.4** Add actual size (100%) mode
- [ ] **1.4.5** Basic zoom controls UI

### 1.5 Basic Navigation (Week 1, Day 7)

- [ ] **1.5.1** Add Previous/Next buttons
- [ ] **1.5.2** Implement arrow key navigation
- [ ] **1.5.3** Handle edge cases (first/last image)
- [ ] **1.5.4** Add basic keyboard shortcut system

### 1.6 Layout Foundation (Week 2, Days 1-2)

- [ ] **1.6.1** Create main layout component structure
- [ ] **1.6.2** Add basic header/toolbar area
- [ ] **1.6.3** Add main image display area
- [ ] **1.6.4** Add status bar area
- [ ] **1.6.5** Implement responsive grid layout

### 1.7 Theme System (Week 2, Days 3-4)

- [ ] **1.7.1** Setup CSS custom properties for theming
- [ ] **1.7.2** Create light theme variables
- [ ] **1.7.3** Create dark theme variables
- [ ] **1.7.4** Add theme toggle store and component
- [ ] **1.7.5** Persist theme preference

### 1.8 File Format Support (Week 2, Days 5-6)

- [ ] **1.8.1** Test JPEG support and optimization
- [ ] **1.8.2** Test PNG support with transparency
- [ ] **1.8.3** Test WebP format support
- [ ] **1.8.4** Test GIF static display
- [ ] **1.8.5** Add format detection and validation

### 1.9 Polish & Testing (Week 2, Day 7)

- [ ] **1.9.1** Add error boundaries and user feedback
- [ ] **1.9.2** Improve loading states and transitions
- [ ] **1.9.3** Test cross-platform compatibility
- [ ] **1.9.4** Add basic accessibility features
- [ ] **1.9.5** Create demo images for testing

**Deliverable**: Basic functional image viewer

---

## Phase 2: Enhanced Viewing (Weeks 3-4)

**Goal**: Advanced viewing capabilities

### 2.1 Advanced Image Handling

- [ ] RAW format support (CR2, NEF, ARW, etc.)
- [ ] TIFF, PSD basic support
- [ ] Animated GIF/WebP playback
- [ ] SVG rendering
- [ ] HEIC/HEIF support

### 2.2 Viewing Enhancements

- [ ] Smooth zoom with mouse wheel
- [ ] Pan with mouse drag
- [ ] Rotation (90°, arbitrary angles)
- [ ] Full-screen mode
- [ ] Dual-monitor support
- [ ] Touch/gesture support (pinch-to-zoom)

### 2.3 Performance Optimization

- [ ] Image caching system
- [ ] Lazy loading for large images
- [ ] Memory management for large files
- [ ] Hardware acceleration where possible

### 2.4 Metadata Display

- [ ] EXIF data viewer
- [ ] Image properties panel
- [ ] GPS location display
- [ ] Histogram view

**Deliverable**: Feature-rich image viewer with excellent performance

---

## Phase 3: Basic Editing (Weeks 5-6)

**Goal**: Essential image editing capabilities

### 3.1 Non-destructive Editing Foundation

- [ ] Edit history system
- [ ] Undo/Redo functionality
- [ ] Layer-based editing architecture
- [ ] Preview system

### 3.2 Basic Editing Tools

- [ ] Crop tool with aspect ratio options
- [ ] Resize with quality options
- [ ] Rotate (90°, 180°, 270°, arbitrary)
- [ ] Flip horizontal/vertical
- [ ] Auto-level/Auto-contrast
- [ ] Brightness/Contrast adjustment

### 3.3 Color Adjustments

- [ ] Hue/Saturation/Lightness
- [ ] Color temperature adjustment
- [ ] Gamma correction
- [ ] Color curves
- [ ] Black/White point adjustment

### 3.4 Filters & Effects

- [ ] Sharpen/Blur
- [ ] Noise reduction
- [ ] Basic filters (Sepia, B&W, etc.)
- [ ] Red-eye removal
- [ ] Basic retouching tools

**Deliverable**: Image viewer with basic editing capabilities

---

## Phase 4: File Management & Organization (Weeks 7-8)

**Goal**: Comprehensive file management

### 4.1 Advanced File Operations

- [ ] Copy/Move/Delete images
- [ ] Rename with pattern support
- [ ] Create folders
- [ ] File association management
- [ ] Drag & drop support

### 4.2 Thumbnail Browser

- [ ] Grid view with configurable sizes
- [ ] Fast thumbnail generation
- [ ] Thumbnail caching
- [ ] Quick preview on hover
- [ ] Multi-select operations

### 4.3 Organization Features

- [ ] Favorite/Rating system
- [ ] Tag/Label system
- [ ] Search functionality
- [ ] Filter by date/size/type
- [ ] Collections/Albums

### 4.4 Slideshow Mode

- [ ] Automatic slideshow
- [ ] Configurable timing
- [ ] Transition effects
- [ ] Background music support
- [ ] Slideshow controls

**Deliverable**: Complete file management and organization system

---

## Phase 5: Batch Processing (Weeks 9-10)

**Goal**: Powerful batch processing capabilities

### 5.1 Batch Operations Framework

- [ ] Queue-based processing system
- [ ] Progress tracking
- [ ] Error handling and logging
- [ ] Pause/Resume functionality

### 5.2 Batch Editing

- [ ] Batch resize with multiple output formats
- [ ] Batch format conversion
- [ ] Batch rename with patterns
- [ ] Batch watermarking
- [ ] Batch color correction

### 5.3 Advanced Batch Features

- [ ] Custom action sequences
- [ ] Conditional processing
- [ ] Output folder organization
- [ ] Quality optimization
- [ ] EXIF data manipulation

### 5.4 Automation

- [ ] Watch folder functionality
- [ ] Scheduled batch jobs
- [ ] Command-line interface
- [ ] Preset management

**Deliverable**: Professional-grade batch processing system

---

## Phase 6: Advanced Features (Weeks 11-12)

**Goal**: Professional and power-user features

### 6.1 Plugin System

- [ ] Plugin architecture design
- [ ] Plugin API development
- [ ] Plugin manager UI
- [ ] Sample plugins (Instagram filters, etc.)
- [ ] Plugin store/marketplace

### 6.2 Advanced Editing

- [ ] Layer support
- [ ] Masking tools
- [ ] Advanced selection tools
- [ ] Clone/healing tools
- [ ] Perspective correction

### 6.3 Format Support Extension

- [ ] Additional RAW formats
- [ ] Scientific image formats (DICOM, etc.)
- [ ] Archive format browsing (ZIP, RAR)
- [ ] PDF page viewing
- [ ] Video frame extraction

### 6.4 Professional Features

- [ ] Color profile management
- [ ] Print dialog with preview
- [ ] Contact sheet generation
- [ ] Comparison view (side-by-side)
- [ ] Focus stacking

**Deliverable**: Professional-grade image editing and viewing application

---

## Phase 7: Modern Enhancements (Weeks 13-14)

**Goal**: Modern features and integrations

### 7.1 Cloud Integration

- [ ] Google Drive integration
- [ ] OneDrive integration
- [ ] Dropbox integration
- [ ] Cloud sync for settings
- [ ] Remote image viewing

### 7.2 AI-Powered Features

- [ ] Auto-tagging with AI
- [ ] Smart cropping suggestions
- [ ] Object removal
- [ ] Upscaling with AI
- [ ] Style transfer filters

### 7.3 Collaboration Features

- [ ] Image sharing with links
- [ ] Annotation tools
- [ ] Comment system
- [ ] Version history
- [ ] Team workspaces

### 7.4 Advanced UI/UX

- [ ] Customizable toolbars
- [ ] Workspace layouts
- [ ] Gesture customization
- [ ] Voice commands
- [ ] Accessibility improvements

**Deliverable**: Modern, AI-enhanced image editor

---

## Phase 8: Polish & Distribution (Weeks 15-16)

**Goal**: Production-ready application

### 8.1 Performance Optimization

- [ ] Memory usage optimization
- [ ] Startup time improvement
- [ ] Large file handling
- [ ] Multi-threading optimization
- [ ] GPU acceleration

### 8.2 Testing & Quality Assurance

- [ ] Comprehensive test suite
- [ ] Performance benchmarking
- [ ] Cross-platform testing
- [ ] Accessibility testing
- [ ] Security audit

### 8.3 Documentation & Help

- [ ] User manual
- [ ] Video tutorials
- [ ] Keyboard shortcut reference
- [ ] Plugin development guide
- [ ] API documentation

### 8.4 Distribution

- [ ] Auto-updater system
- [ ] App store submissions
- [ ] Website and landing page
- [ ] Marketing materials
- [ ] Community building

**Deliverable**: Production-ready application ready for distribution

---

## 🛠️ Technical Stack

### Frontend

- **Framework**: Svelte 5 with runes
- **Build Tool**: SvelteKit + Vite
- **Styling**: CSS with custom properties (CSS variables)
- **State Management**: Svelte 5 runes with custom stores
- **UI Components**: Custom component library
- **Icons**: Lucide or Heroicons

### Backend (Rust)

- **Framework**: Tauri 2
- **Image Processing**: `image` crate, `imageproc`
- **File System**: Tauri filesystem API
- **Performance**: `rayon` for parallelization
- **Serialization**: `serde`
- **Database**: `rusqlite` for metadata/settings

### Additional Libraries

- **Image Formats**: `image`, `raw-formats`, `pdf-extract`
- **UI Interactions**: Custom gesture handling
- **Shortcuts**: Tauri global shortcuts
- **Notifications**: Tauri notifications

---

## 📊 Success Metrics

### Performance Targets

- [ ] Startup time < 2 seconds
- [ ] Image load time < 500ms (for typical photos)
- [ ] Memory usage < 200MB idle, < 1GB with large images
- [ ] Smooth 60fps UI interactions

### Feature Completion

- [ ] Support for 50+ image formats
- [ ] 100+ keyboard shortcuts
- [ ] 20+ editing tools
- [ ] Cross-platform compatibility (Windows, macOS, Linux)

### User Experience

- [ ] Intuitive UI requiring minimal learning
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Multi-language support
- [ ] Comprehensive help system

---

## 🔄 Iteration Notes

This roadmap is living document that will be updated as we progress. Each phase includes:

- **Entry Criteria**: What must be completed before starting
- **Exit Criteria**: What must be delivered to complete the phase
- **Review Points**: Weekly reviews to assess progress
- **Flexibility**: Ability to adjust scope based on discoveries

---

## 🚀 Getting Started

### **Immediate Next Task (1.2.1)**: Setup Tauri Filesystem Permissions

**Estimated Time**: 30 minutes
**Goal**: Enable file system access for image loading

**Steps**:

1. Update `src-tauri/tauri.conf.json` with filesystem permissions
2. Add file dialog permissions
3. Test file selection dialog

### **Today's Target**: Complete tasks 1.2.1 through 1.2.3

**Estimated Time**: 2-3 hours
**Outcome**: Working file selection and basic error handling

### **This Week's Goal**: Complete Phase 1.2-1.5 (File system + basic image viewing)

**Outcome**: Can open and display images with basic zoom and navigation

---

## 📅 Daily Breakdown for Week 1

### **Day 1 (Today)**: File System Foundation

- [ ] **Morning**: Tasks 1.2.1-1.2.2 (File permissions & dialog)
- [ ] **Afternoon**: Tasks 1.2.3-1.2.4 (Error handling & file info)

### **Day 2**: Complete File System + Start Display

- [ ] **Morning**: Task 1.2.5 + Start 1.3.1-1.3.2
- [ ] **Afternoon**: Tasks 1.3.3-1.3.4

### **Day 3**: Image Display

- [ ] **Morning**: Task 1.3.5 + Start 1.4.1-1.4.2
- [ ] **Afternoon**: Tasks 1.4.3-1.4.4

### **Day 4**: Zoom & Navigation

- [ ] **Morning**: Task 1.4.5 + Start 1.5.1-1.5.2
- [ ] **Afternoon**: Tasks 1.5.3-1.5.4

### **Day 5-7**: Layout & Theme

- Continue with remaining tasks...

---

_Last Updated: November 26, 2025_
_Status: Phase 1.1 Complete ✅_
