# Kahveci View - Modern Image Viewer & Editor Roadmap

> An IrfanView alternative built with Tauri 2, Svelte 5, and Rust

## 🎯 Project Vision

Create a fast, lightweight, cross-platform image viewer and editor that combines the simplicity of IrfanView with modern UI/UX and extensibility.

## � Current Progress Status

**Phase 1: COMPLETED ✅ | Phase 2: COMPLETED ✅**

## Phase 2: Design System Migration (COMPLETED ✅)

### 2.1 Tailwind CSS Integration

- [x] Tailwind CSS v4.1 setup with Vite
- [x] 4-color palette configuration (#101010, #141414, #F5F5F5, #EE3B3E)
- [x] Mulish font integration
- [x] Design system architecture

### 2.2 Component Migration

- [x] StatusBar component migrated to Tailwind
- [x] Toolbar component migrated to Tailwind
- [x] DefaultState component migrated to Tailwind
- [x] ImageViewer component migrated to Tailwind
- [x] FileExplorer component migrated to Tailwind
- [x] Multi-line class formatting for readability

### 2.3 Design System Refinement

- [x] Semantic color token structure
- [x] Responsive design patterns
- [x] Professional multi-line class formatting
- [x] Complete CSS removal and utility-first approach
- [x] Testing and validation

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

- [x] **1.2.1** Setup Tauri filesystem permissions in `tauri.conf.json` ✅
- [x] **1.2.2** Create file dialog integration (open file) ✅
- [x] **1.2.3** Add file path validation and error handling ✅
- [x] **1.2.4** Create basic file info extraction (name, size, extension) ✅
- [x] **1.2.5** Test file selection with common image formats ✅

### 1.3 Basic Image Display (Week 1, Days 3-4)

- [x] **1.3.1** Create ImageViewer component structure ✅
- [x] **1.3.2** Implement image loading from file path ✅
- [x] **1.3.3** Add basic image display with proper scaling ✅
- [x] **1.3.4** Handle image loading errors gracefully ✅
- [x] **1.3.5** Add loading spinner/placeholder ✅

### 1.4 Layout & UI Foundation (Week 1, Days 5-6) ✅

- [x] **1.4.1** Create top toolbar component with open image button ✅
- [x] **1.4.2** Create bottom status bar for image information display ✅
- [x] **1.4.3** Implement default app state (400x400 with "Open Image" message) ✅
- [x] **1.4.4** Add emoji-based icons for UI elements (no SVGs yet) ✅
- [x] **1.4.5** Create responsive layout structure (top bar + content + bottom bar) ✅

**✨ Completed**: Major UI/UX refactor from sidebar to modern app layout

- **Toolbar.svelte**: Top navigation with gradient design, open image functionality
- **StatusBar.svelte**: Bottom info bar with file metadata and status updates
- **DefaultState.svelte**: 400x400 default state with animated "Open Image" call-to-action
- **Updated Layout**: Three-tier architecture (Toolbar + Content + StatusBar)
- **Fixed**: Compilation error in ImageViewer component (HTML structure issue)

### 1.5 Simple Zoom (Week 1, Day 7)

- [ ] **1.5.1** Add zoom state management (zoom level store)
- [ ] **1.5.2** Implement zoom in/out buttons in toolbar
- [ ] **1.5.3** Add fit-to-window mode
- [ ] **1.5.4** Add actual size (100%) mode
- [ ] **1.5.5** Basic zoom controls UI integration

### 1.6 Basic Navigation (Week 2, Day 1)

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

### 1.8 Theme System (Week 2, Days 4-5)

- [ ] **1.8.1** Setup CSS custom properties for theming
- [ ] **1.8.2** Create light theme variables
- [ ] **1.8.3** Create dark theme variables
- [ ] **1.8.4** Add theme toggle in toolbar
- [ ] **1.8.5** Persist theme preference

### 1.9 File Format Support (Week 2, Days 6-7)

- [ ] **1.9.1** Test JPEG support and optimization
- [ ] **1.9.2** Test PNG support with transparency
- [ ] **1.9.3** Test WebP format support
- [ ] **1.9.4** Test GIF static display
- [ ] **1.9.5** Add format detection and validation

### 1.10 Polish & Testing (Week 2, Day 7)

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

### **Current Status**: Phase 1.3 Complete ✅ - Ready for Phase 1.4

**Last Achievement**: Image display functionality working perfectly with comprehensive logging system

### **Immediate Next Task (1.4.1)**: Create Top Toolbar Component

**Estimated Time**: 45 minutes  
**Goal**: Create a clean top toolbar with open image functionality

**Steps**:

1. Create `Toolbar.svelte` component following Svelte 5 runes pattern
2. Add open image button with emoji icon (📁 or 🖼️)
3. Integrate with existing file service
4. Style with modern, clean design

### **Today's Target**: Complete tasks 1.4.1 through 1.4.3

**Estimated Time**: 2-3 hours  
**Outcome**: Clean layout with top/bottom bars and proper default state

### **This Week's Goal**: Complete Phase 1.4-1.5 (Layout + Zoom)

**Outcome**: Professional layout with working zoom functionality

---

## 📅 Daily Breakdown for Week 1-2

### **Day 1-4**: Foundation Complete ✅

- ✅ File System Foundation (Tasks 1.2.1-1.2.5)
- ✅ Basic Image Display (Tasks 1.3.1-1.3.5)

### **Day 5-6**: Layout & UI Foundation (Phase 1.4)

- [ ] **Morning**: Tasks 1.4.1-1.4.2 (Top toolbar & bottom status bar)
- [ ] **Afternoon**: Tasks 1.4.3-1.4.5 (Default state & responsive layout)

### **Day 7**: Simple Zoom (Phase 1.5)

- [ ] **Morning**: Tasks 1.5.1-1.5.3 (Zoom state & controls)
- [ ] **Afternoon**: Tasks 1.5.4-1.5.5 (Zoom modes & UI integration)

### **Week 2**: Enhanced Features

- [ ] **Day 1**: Basic Navigation (Phase 1.6)
- [ ] **Day 2-3**: Enhanced File Operations (Phase 1.7)
- [ ] **Day 4-5**: Theme System (Phase 1.8)
- [ ] **Day 6-7**: File Format Support & Polish (Phase 1.9-1.10)

---

_Last Updated: November 27, 2025_  
_Status: Phase 1.3 Complete ✅ - Basic Image Display Working_

## Recent Achievements ✅

### Image Loading Success (November 27, 2025)

- **Fixed Critical Issue**: Images now loading successfully after asset protocol configuration
- **Enhanced Logging**: Implemented comprehensive debug logging system with runtime controls
- **Advanced Architecture**: Created dedicated logger utility following coding instructions
- **Performance**: Image loading working smoothly (tested with 3.54 MB JPG file)
- **Error Handling**: Comprehensive validation and error recovery system
- **State Management**: Proper reactive state management with Svelte 5 runes

### Technical Improvements Made

- **Asset Protocol**: Fixed Tauri v2 asset serving configuration for local file access
- **Debug System**: Runtime-controllable logging with localStorage persistence
- **File Service**: Enhanced with detailed operational logging and error tracking
- **Dependencies**: Added chrono for proper timestamp handling
- **Validation**: Platform-specific file path validation and security checks

### Current Working Features

- ✅ File dialog with image format filtering
- ✅ File path validation and security checks
- ✅ File metadata extraction (size, modification date, format)
- ✅ Image loading with proper asset URL conversion
- ✅ Responsive image display with scaling
- ✅ Loading states and error handling
- ✅ Two-column layout (FileExplorer + ImageViewer)
- ✅ Comprehensive logging and debugging system
