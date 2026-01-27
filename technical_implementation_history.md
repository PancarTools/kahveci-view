# Technical Implementation History - Kahveci View

## Project Overview

Kahveci View is a modern image viewer application built with Tauri 2, Svelte 5, and Rust. It aims to be an IrfanView alternative with modern UI/UX and cross-platform compatibility.

## Architecture Decisions

### Frontend Stack

- **Framework**: Svelte 5 with runes for reactive state management
- **Build Tool**: SvelteKit + Vite for optimal development experience
- **Styling**: Tailwind CSS v4.1 with custom 4-color design system
- **State Management**: Custom Svelte 5 rune-based stores following pattern from copilot instructions

### Backend Stack

- **Framework**: Tauri 2 for cross-platform native capabilities
- **Image Processing**: Built-in browser image handling with Tauri asset protocol
- **File System**: Tauri plugins (dialog, fs) with capabilities-based permissions
- **Logging**: Custom Rust logger command with TypeScript wrapper

## Major Implementation Milestones

### Phase 1.1: Project Foundation (Completed ✅)

**Date**: November 26, 2025
**Commits**: Initial project setup

**Architectural Decisions Made**:

1. Chose Tauri 2 over Electron for better performance and security
2. Selected Svelte 5 with runes for modern reactive programming
3. Implemented capabilities-based permission system for file access

**Key Files Created**:

- Basic Tauri + SvelteKit project structure
- Initial configuration files (tauri.conf.json, vite.config.js)
- Package.json with required dependencies

### Phase 1.2: File System Foundation (Completed ✅)

**Date**: November 26, 2025

**Architectural Decisions Made**:

1. **File Service Architecture**: Created centralized file service using Svelte 5 runes
   - Pattern: `fileService.svelte.ts` with reactive state management
   - Reasoning: Centralized file operations with reactive updates across components

2. **Error Handling Strategy**: Implemented comprehensive validation system
   - Path validation for security (injection prevention)
   - Format validation with extensible format support
   - Platform-specific validations (Windows reserved names, etc.)
   - Reasoning: Security-first approach with detailed user feedback

3. **File Metadata Extraction**: Used Tauri fs plugin for reliable file information
   - File size, modification date, extension detection
   - Human-readable formatting utilities
   - Reasoning: Native file system access for accurate metadata

**Key Implementation Details**:

- **Permissions Configuration**: Used capabilities in `src-tauri/capabilities/default.json`
  ```json
  {
  	"identifier": "fs:allow-stat",
  	"allow": [{ "path": "$HOME/**/*" }, { "path": "$PICTURE/**/*" }]
  }
  ```
- **Dialog Integration**: Tauri dialog plugin with image format filters
- **State Management**: Reactive loading states and error handling

**Files Modified**:

- `src/lib/stores/fileService.svelte.ts`: Core file operations
- `src-tauri/capabilities/default.json`: File system permissions
- `src-tauri/tauri.conf.json`: Plugin configurations

### Phase 1.3: Image Display Implementation (Completed ✅)

**Date**: November 27, 2025

**Architectural Decisions Made**:

1. **Asset Protocol Configuration**: Enabled Tauri asset protocol for local file serving
   - Added assetProtocol configuration to tauri.conf.json
   - Reasoning: Required for browser to access local image files securely

2. **Image Component Architecture**: Created comprehensive ImageViewer component
   - Reactive state management for loading, error, and display states
   - Event-driven image loading with comprehensive error handling
   - Responsive design with proper image scaling
   - Reasoning: Separation of concerns with robust error handling

3. **Logging System Enhancement**: Implemented advanced debugging system
   - Custom logger utility with debug level controls
   - Runtime debug toggling via localStorage
   - Context-aware logging with performance utilities
   - Both browser console and Tauri backend logging
   - Reasoning: Essential for debugging complex file loading issues

4. **Performance Instrumentation (December 11, 2025)**
   - Added ISO-style timestamps to all Rust-side logs via the `logger` Tauri command for precise ordering in the Tauri console
   - Integrated cross-layer PERF logging using the shared `logger` utility in:
     - `FileService` (`openFile`, `openFileByPath`) for end-to-end file open timings
     - `NavigationStore` (`scanFolder`, `preloadImage`) for folder scan and preload decode timings
     - `ImageViewer` (`loadAndRender`) for decode, GPU upload, and first-render timings
     - `WebGLRenderer.loadImage` for detailed texture upload timing (including `texImage2D` duration)
   - All PERF logs are emitted with clear contexts (e.g. `PERF/FileService`, `PERF/Navigation`, `PERF/ImageViewer`, `PERF/WebGL`) to simplify bottleneck analysis when navigating large images

**Critical Bug Fix**:

- **Issue**: Images failing to load with "Failed to Load Image" error
- **Root Cause**: Missing asset protocol configuration in Tauri v2
- **Solution**: Added assetProtocol configuration to `tauri.conf.json`:
  ```json
  "security": {
    "assetProtocol": {
      "enable": true,
      "scope": ["$HOME/**", "$DESKTOP/**", "$DOWNLOAD/**", "$PICTURE/**"]
    }
  }
  ```

**Key Implementation Details**:

- **Image Loading Flow**: File selection → Path validation → Asset URL conversion → Image display
- **Error Handling**: Multiple fallbacks and detailed error reporting
- **State Management**: Reactive image dimensions, loading states, and error states
- **Performance**: Lazy loading and proper memory management

**Files Created/Modified**:

- `src/lib/components/ImageViewer.svelte`: Complete image display component
- `src/lib/utils/logger.ts`: Advanced logging system (user-created enhancement)
- `src-tauri/tauri.conf.json`: Asset protocol configuration
- `src-tauri/Cargo.toml`: Added chrono dependency for timestamping (user enhancement)
- `src/lib/stores/fileService.svelte.ts`: Enhanced with advanced logging

## Current Architecture State

### Component Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── FileExplorer.svelte (file selection UI)
│   │   └── ImageViewer.svelte (image display with error handling)
│   ├── stores/
│   │   └── fileService.svelte.ts (centralized file operations)
│   └── utils/
│       └── logger.ts (advanced logging system)
├── routes/
│   └── +page.svelte (main layout)
└── app.html
```

### Tauri Backend Structure

```
src-tauri/
├── src/
│   └── lib.rs (logger command + plugin initialization)
├── capabilities/
│   └── default.json (file system permissions)
├── tauri.conf.json (app configuration + asset protocol)
└── Cargo.toml (dependencies)
```

### Data Flow Architecture

1. **File Selection**: Dialog → Path validation → Metadata extraction → State update
2. **Image Display**: Path → Asset URL conversion → Image loading → Reactive UI updates
3. **Error Handling**: Validation → User feedback → Logging → Recovery options
4. **Logging**: Frontend events → Tauri commands → Console output + File logging

## Technology Choices Rationale

### Why Svelte 5 Runes?

- **Performance**: Compile-time optimizations and fine-grained reactivity
- **Developer Experience**: Simple syntax with powerful reactivity
- **Future-Proof**: Latest stable version with long-term support
- **Bundle Size**: Smaller runtime compared to React/Vue

### Why Tauri v2?

- **Security**: Capabilities-based permissions vs. unlimited Node.js access
- **Performance**: Rust backend with native OS integration
- **Bundle Size**: Significantly smaller than Electron apps
- **Cross-Platform**: Native feel on all platforms

### Custom Store Pattern vs. Libraries

- **Simplicity**: Direct Svelte 5 runes without additional abstractions
- **Type Safety**: Full TypeScript integration
- **Performance**: No middleware overhead
- **Maintainability**: Self-contained with minimal dependencies

## Current Challenges & Solutions

### Image Loading Complexity

**Challenge**: Browser security restrictions for local file access
**Solution**: Tauri asset protocol with proper scope configuration
**Lessons Learned**: Tauri v2 requires explicit asset protocol configuration

### Debugging in Desktop Environment

**Challenge**: Limited debugging tools compared to web development
**Solution**: Comprehensive logging system with runtime controls
**Implementation**: Custom logger with both console and backend logging

### Cross-Platform File Path Handling

**Challenge**: Different path formats and reserved names across platforms
**Solution**: Comprehensive validation with platform-specific checks
**Future Consideration**: May need additional testing on Windows/Linux

## Next Steps & Technical Debt

### Immediate Technical Tasks

1. **State Management Consolidation**: Update all components to use new logger utility
2. **Performance Optimization**: Implement proper image caching and memory management
3. **Error Recovery**: Add retry mechanisms for failed image loads
4. **Testing**: Implement automated testing for file operations

### Future Architecture Considerations

1. **Plugin System**: Design extensible architecture for image format plugins
2. **Performance**: Consider worker threads for large image processing
3. **Caching**: Implement intelligent thumbnail and metadata caching
4. **Configuration**: User preferences and settings management system

## Lessons Learned

### Tauri v2 Migration Considerations

- Asset protocol requires explicit configuration (not auto-enabled)
- Capabilities system is more restrictive but provides better security
- Plugin ecosystem has breaking changes from v1

### Svelte 5 Runes Patterns

- Custom stores with runes provide excellent developer experience
- Reactive derivations work well for computed values
- Effect system is powerful for side effects management

### Development Workflow

- Comprehensive logging is essential for desktop app debugging
- File system operations require careful error handling and validation
- Security-first approach prevents common vulnerabilities

### Phase 1.4: Layout & UI Foundation (Completed ✅)

**Date**: November 30, 2025

**Architectural Decisions Made**:

1. **Major UI Architecture Refactor**: Transitioned from sidebar to modern app layout
   - **Decision**: Moved from two-column layout to three-tier layout (Toolbar + Content + StatusBar)
   - **Rationale**: Modern app design patterns, better space utilization, professional appearance
   - **Implementation**: Created separate components for each tier with clear responsibilities

2. **Component-Based Layout System**: Created dedicated layout components

   ```typescript
   // Component Structure:
   Toolbar.svelte      - Top navigation and controls
   StatusBar.svelte    - Bottom status information
   DefaultState.svelte - 400x400 default app state
   ImageViewer.svelte  - Adapted for new layout structure
   ```

3. **Emoji-First UI Design**: Used emoji icons instead of SVG dependencies
   - **Decision**: Emoji icons for initial UI elements
   - **Rationale**: No external dependencies, universal support, quick prototyping
   - **Examples**: 📁 (Open), 🖼️ (Image), ✨ (Visual enhancement)

**Key Files Created/Modified**:

- `src/lib/components/Toolbar.svelte` (NEW)
  - Top navigation bar with gradient design
  - Open image functionality integrated
  - Responsive design with hover effects
- `src/lib/components/StatusBar.svelte` (NEW)
  - File path display and image metadata
  - Real-time status updates
  - Monospace font for technical information
- `src/lib/components/DefaultState.svelte` (NEW)
  - 400x400 pixel default application state
  - Animated floating icons and hover effects
  - Call-to-action design for opening images
- `src/routes/+page.svelte` (MODIFIED)
  - Updated to three-tier layout structure
  - Conditional rendering based on file state
  - Global CSS reset and layout management
- `src/lib/components/ImageViewer.svelte` (REFACTORED)
  - Removed old no-image state (moved to DefaultState)
  - Streamlined for new layout integration
  - Fixed HTML structure compilation error

**Technical Implementation Details**:

1. **Layout Architecture**:

   ```svelte
   <!-- Three-Tier Layout Structure -->
   <Toolbar />
   <main class="content">
     {#if fileService.currentFile}
       <ImageViewer />
     {:else}
       <DefaultState />
     {/if}
   </main>
   <StatusBar />
   ```

2. **Responsive Design System**:
   - CSS Grid for layout structure
   - Flexible height allocation (auto + 1fr + auto)
   - Dark mode support with CSS custom properties
   - Smooth transitions and animations

3. **File Service Integration**:
   - All components use centralized file service
   - Reactive updates across layout tiers
   - Consistent state management pattern

**Problems Encountered & Solutions**:

1. **HTML Structure Compilation Error**:
   - **Issue**: Corrupted HTML in ImageViewer.svelte with mismatched div tags
   - **Root Cause**: Duplicate JavaScript event handlers outside of img tag
   - **Solution**: Cleaned up corrupted HTML structure and removed duplicate code
   - **Prevention**: More careful file editing and immediate compilation testing

2. **Layout Component Integration**:
   - **Challenge**: Ensuring consistent file service state across components
   - **Solution**: Used Svelte 5 runes reactive pattern for automatic updates
   - **Result**: Seamless real-time updates across all layout tiers

**Performance Considerations**:

- Minimal re-renders through Svelte 5 runes efficiency
- CSS-only animations for smooth performance
- Conditional rendering to avoid unnecessary component mounting
- Optimized image loading states and error handling

**Key Learnings**:

- Three-tier layout provides better user experience than sidebar approach
- Component separation allows for better maintainability and testing
- Emoji icons provide quick, dependency-free UI development
- Svelte 5 runes make cross-component state management very clean
- Immediate compilation testing prevents structure errors from accumulating

### Phase 2.1: Tailwind CSS Migration (COMPLETED ✅)

**Date**: November 28, 2025
**Commits**: Tailwind v4.1 integration and complete component migration

**Architectural Decisions Made**:

1. **Tailwind CSS v4.1 Adoption**
   - Replaced custom CSS with utility-first approach
   - Integrated @tailwindcss/vite plugin for optimal SvelteKit compatibility
   - Configured with semantic design tokens for maintainability

2. **4-Color Design System**
   - Simplified to user-specified minimal palette: #101010 (bg), #141414 (surface), #F5F5F5 (text), #EE3B3E (accent)
   - Created semantic naming convention: `bg`, `surface`, `text`, `accent`
   - Rejected complex design system in favor of minimal, focused approach

3. **Component Migration Strategy**
   - Incremental migration starting with StatusBar for validation
   - Multi-line class formatting for better readability and maintainability
   - Preserved all functionality and responsive behavior during migration
   - Complete elimination of custom CSS files

4. **Typography Enhancement**
   - Integrated Mulish Google Font (200-1000 weight range)
   - Professional typography hierarchy with consistent font stacks
   - Maintained accessibility through proper contrast ratios

**Technical Implementations**:

- **Configuration**: tailwind.config.js with minimal color palette and Mulish font
- **Global Styles**: app.css with font imports and scrollbar customization
- **Components Migrated**:
  - StatusBar (130+ lines CSS → utilities)
  - Toolbar (110+ lines CSS → utilities)
  - DefaultState (180+ lines CSS → utilities)
  - ImageViewer (120+ lines CSS → utilities)
  - FileExplorer (140+ lines CSS → utilities)
- **Class Organization**: Logical grouping (layout → sizing → colors → interactions → states)

**Performance Optimizations**:

- Removed unused CSS through Tailwind's purging system
- Reduced bundle size by eliminating custom CSS files
- Improved maintainability through centralized design system
- Enhanced developer experience with utility-first approach

**Key Learnings**:

- User feedback crucial for design system complexity - minimal beats comprehensive
- Multi-line class formatting significantly improves code readability
- Tailwind v4.1 integration with SvelteKit requires specific plugin ordering
- Incremental migration reduces risk and validates approach early
- Semantic color naming enables easy theme customization
- Complete migration achieves consistency and maintainability goals

### Phase 2.5: Roadmap Optimization (Completed ✅)

**Date**: November 26, 2025  
**Context**: Project planning and organization optimization

**Optimization Rationale**:

After completing the design system migration, reorganized the development roadmap to improve logical flow and phase organization.

**Improvements Made**:

1. **Phase Restructuring**:
   - Restructured from scattered phases to 8 logical development phases
   - Clear progression from foundation → core features → advanced features → distribution

2. **Phase Organization**:
   - **Phase 1-2**: Foundation & Core Viewing + Design System (COMPLETED)
   - **Phase 3**: Advanced Viewing & Navigation (zoom, full-screen, navigation)
   - **Phase 4**: File Management (operations, metadata, batch processing)
   - **Phase 5**: Basic Editing (crop, rotate, resize, filters)
   - **Phase 6**: Performance & Advanced Features (caching, formats, comparison)
   - **Phase 7**: Modern Integrations (AI features, cloud, plugins)
   - **Phase 8**: Platform Integration & Distribution (stores, auto-update, advanced features)

3. **Documentation Quality**:
   - Each phase now has clear goals and deliverables
   - Better task organization with logical dependencies
   - Clearer progression path for development

**Files Modified**:

- `ROADMAP.md`: Complete reorganization with 8 logical phases
- Preserved old roadmap as `ROADMAP_OLD.md` for reference

**Impact**:

- Improved project planning and development flow
- Clearer understanding of feature dependencies
- Better organization for future development phases

**Next Steps**:
Ready to begin Phase 3 (Advanced Viewing & Navigation) with zoom system implementation using Svelte 5 runes state management.

### Phase 2.6: Icon System Migration (Completed ✅)

**Date**: November 29, 2025  
**Context**: UI improvement and professional icon integration

**Migration Rationale**:

The initial emoji-based icons were functional but not professional-looking. Migration to proper SVG icons improves visual consistency and scalability.

**Implementation Details**:

1. **Icon Library Selection**:
   - Initially attempted UIW Icons but discovered React dependency issues
   - Switched to Lucide Svelte (@lucide/svelte) for proper Svelte compatibility
   - Reasoning: Lucide provides professional, lightweight SVG icons with excellent Svelte integration

2. **Icon Organization**:
   - Created centralized icon export file at `src/lib/icons/index.ts`
   - Organized icons by feature/phase for easy maintenance
   - Phase 1-2: File operations, status indicators
   - Phase 3+: Navigation, zoom, manipulation tools

3. **Component Updates**:
   - **Toolbar**: Replaced 📁 with FolderOpen icon
   - **StatusBar**: Replaced 📂/📄/✅/❌ with Folder/Image/CheckCircle/XCircle
   - **DefaultState**: Replaced 🖼️/📁/⌨️ with Image/FolderOpen/Keyboard
   - **ImageViewer**: Replaced ❌ with XCircle for error states
   - **FileExplorer**: Replaced 📁/📄/❌ with Folder/FileText/XCircle

4. **Design System Integration**:
   - Consistent icon sizing (16px toolbar, 20px prominent actions)
   - Proper color integration with 4-color palette
   - Maintained accessibility with proper ARIA labels via icon titles

**Files Modified**:

- `package.json`: Added @lucide/svelte dependency
- `src/lib/icons/index.ts`: Centralized icon management
- All 5 components updated with professional icons

**Technical Benefits**:

- Professional appearance replacing emoji inconsistencies
- Scalable SVG icons work on all screen resolutions
- Better accessibility and semantic meaning
- Easier maintenance and consistency across components

**Visual Impact**:

- Much more professional and modern appearance
- Consistent visual language throughout the application
- Better user experience with clear, recognizable icons

**Next Steps**:
Ready for Phase 3 implementation with comprehensive icon set prepared for zoom, navigation, and advanced viewing features.

### Phase 2.7: Sophisticated Design System Overhaul (Completed ✅)

**Date**: November 29, 2025  
**Context**: Major visual and UX improvement with modern color science

**Design Philosophy Shift**:

Moved from basic 4-color system to sophisticated, eye-pleasing design using OKLCH color space for better visual consistency and reduced eye strain.

**OKLCH Color Science Implementation**:

1. **Advanced Color Palette**:

   ```css
   --bg-dark: oklch(0.1 0.015 235); // Global background
   --bg: oklch(0.15 0.015 235); // Component backgrounds
   --bg-light: oklch(0.2 0.015 235); // Elevated surfaces
   --text: oklch(0.96 0.03 235); // Primary text
   --text-muted: oklch(0.76 0.03 235); // Secondary text
   --highlight: oklch(0.5 0.03 235); // Subtle highlights
   --border: oklch(0.4 0.03 235); // Borders
   --border-muted: oklch(0.3 0.03 235); // Subtle borders
   --primary: oklch(0.76 0.1 235); // Primary accent
   --secondary: oklch(0.76 0.1 55); // Secondary accent
   ```

2. **Design System Benefits**:
   - **Perceptual Uniformity**: OKLCH ensures consistent visual weight across colors
   - **Better Accessibility**: Proper contrast ratios with scientific color relationships
   - **Reduced Eye Strain**: Subtle separations instead of harsh contrasts
   - **Professional Appearance**: Sophisticated color relationships

**Visual Improvements**:

1. **Subtle Component Separation**:
   - Removed harsh white lines and high contrast borders
   - Used gentle elevation with `border-border-muted` for separation
   - Implemented layered background system (bg-dark → bg → bg-light)

2. **Enhanced Typography Hierarchy**:
   - `text` for primary content
   - `text-muted` for secondary information
   - `primary`/`secondary` for accent elements
   - Better visual hierarchy with proper contrast ratios

3. **Refined Spacing and Proportions**:
   - Increased component padding for better breathing room
   - Consistent spacing scale throughout application
   - Improved icon sizes and alignment

4. **Advanced Shadow System**:
   ```css
   'soft': '0 2px 8px oklch(0.05 0.015 235 / 0.1)',
   'medium': '0 4px 16px oklch(0.05 0.015 235 / 0.15)',
   'large': '0 8px 32px oklch(0.05 0.015 235 / 0.2)',
   'glow': '0 0 20px oklch(0.76 0.1 235 / 0.1)',
   ```

**Component-Specific Improvements**:

- **Global Layout**: `bg-dark` as global background with better body styling
- **Toolbar**: Cleaner design with subtle borders, increased height (h-16), better button styling
- **StatusBar**: Refined information hierarchy, better icon sizing, subtle separators
- **DefaultState**: Enhanced welcome screen with layered background cards and subtle call-to-action
- **ImageViewer**: Improved error states with better visual feedback
- **FileExplorer**: Consistent styling with new color system

**Technical Implementation**:

- Updated `tailwind.config.js` with complete OKLCH color system
- Modified `app.html` to include global background and typography
- Refactored all components to use semantic color tokens
- Improved hover and interaction states across components

**UX/Accessibility Enhancements**:

- Better focus states and interaction feedback
- Consistent visual language throughout application
- Improved readability with proper contrast ratios
- Reduced cognitive load with subtle visual separations

**Performance Optimizations**:

- Eliminated complex CSS gradients and shadows
- Streamlined color palette reduces CSS bundle size
- Consistent color tokens improve maintainability

**Files Modified**:

- `tailwind.config.js`: Complete color system overhaul
- `src/app.html`: Global styling improvements
- `src/routes/+page.svelte`: Layout refinements
- All 5 components updated with new design system

**Visual Impact**:

- Professional, sophisticated appearance
- Significantly improved eye comfort for extended use
- Modern design language competitive with premium applications
- Better user experience with subtle, intentional design decisions

**Next Steps**:
Design system foundation now ready for Phase 3 advanced features with professional visual polish.

### Phase 2.8: Tailwind v4 @theme Implementation & Background Fix (Completed ✅)

**Date**: November 29, 2025  
**Duration**: ~2 hours  
**Context**: Resolving white background issues and implementing proper Tailwind v4 syntax

**Problem Identified**: User reported white background issues despite the sophisticated color system implementation. Analysis revealed that while custom color variables were defined, they weren't being properly generated as Tailwind utilities due to improper Tailwind v4 implementation.

**Root Cause Analysis**:

1. **Color Definition Method**: Colors were defined in JavaScript config rather than CSS using @theme directive
2. **Tailwind v4 Migration**: @theme directive is the proper way to define custom utilities in Tailwind v4
3. **Background Inheritance**: Layout components weren't explicitly using dark background classes
4. **HSL Format Issues**: Space-separated HSL values weren't being recognized correctly

**Technical Solutions Implemented**:

**1. @theme Directive Migration**

- **Issue**: Color utilities weren't being generated from JavaScript config
- **Solution**: Migrated all colors to CSS @theme directive in app.css
- **Implementation**:
  ```css
  @theme {
  	/* HSL-based color system with softer, more nuanced tones */
  	--color-brand-dark: hsl(220 8% 8%);
  	--color-brand-darker: hsl(220 8% 12%);
  	// ... rest of color system
  }
  ```
- **Benefit**: Proper Tailwind v4 syntax generating semantic class names like `bg-brand-dark`

**2. HSL Format Correction**

- **Issue**: Space-separated HSL values causing fallback to black/white
- **Solution**: Used complete hsl() function format instead of space-separated values
- **Before**: `--color-brand-dark: 220 8% 8%`
- **After**: `--color-brand-dark: hsl(220 8% 8%)`

**3. Background Inheritance Fix**

- **Issue**: Layout components had implicit white backgrounds
- **Solution**: Added explicit dark background classes throughout layout hierarchy
- **Implementation**:

  ```svelte
  <!-- Layout wrapper -->
  <div class="bg-brand-dark text-brand-white antialiased">

  <!-- Main app container -->
  <div class="flex flex-col h-screen w-screen bg-brand-dark text-brand-white">

  <!-- Main content area -->
  <main class="... bg-brand-dark">
  ```

**4. Global CSS Enhancements**

- **Issue**: Root elements not properly inheriting dark theme
- **Solution**: Enhanced global styles with comprehensive dark theme coverage
- **Implementation**:

  ```css
  html,
  body {
  	background-color: hsl(var(--color-brand-dark));
  	color: hsl(var(--color-brand-white));
  	margin: 0;
  	padding: 0;
  	width: 100%;
  	height: 100%;
  	overflow: hidden;
  }

  #app,
  #svelte {
  	background-color: hsl(var(--color-brand-dark));
  	width: 100%;
  	height: 100%;
  }
  ```

**Research Process**:

- Consulted official Tailwind v4 documentation to understand @theme directive
- Confirmed that Tailwind v4 requires CSS-based color definitions for utility generation
- Verified proper HSL format requirements for color function generation

**Files Modified**:

- `src/app.css`: Added @theme directive, enhanced global styles, fixed HSL format
- `src/routes/+layout.svelte`: Added dark theme wrapper
- `src/routes/+page.svelte`: Added explicit background classes
- `tailwind.config.js`: Removed duplicate color definitions (handled by @theme)

**Validation Results**:

- ✅ Clean semantic class names generated (e.g., `border-brand-subtle` instead of `border-[hsl(var(--color-brand-subtle))]`)
- ✅ No more white background leakage
- ✅ Consistent dark theme across all components
- ✅ Proper Tailwind v4 implementation with @theme directive

**User Experience Impact**:

- **Before**: White backgrounds appearing sporadically, long unreadable arbitrary class names
- **After**: Consistent dark theme, clean semantic class names, professional appearance
- **Maintainability**: Much cleaner codebase with semantic utilities

**Technical Debt Resolved**:

- Proper Tailwind v4 migration with @theme directive
- Eliminated arbitrary value class names for better readability
- Consistent color system implementation
- Comprehensive dark theme coverage

**Design System Improvements**:

- Semantic class naming (e.g., `bg-brand-light`, `text-brand-muted`)
- Clean separation between CSS color definitions and JavaScript config
- Better maintainability with centralized @theme block
- Professional utility generation aligned with Tailwind v4 best practices

### Phase 2.9: Custom Window Management Implementation (Completed ✅)

**Date**: November 29, 2025

**Goal**: Implement native-feeling window management with custom titlebar

**Architectural Decisions Made**:

1. **Custom Titlebar System**: Disabled OS decorations for unified theme
2. **Tauri Window API Integration**: Used native window controls for reliable behavior
3. **Custom Drag Implementation**: Used Rust command instead of data-tauri-drag-region for better reliability

**Technical Implementation**:

**Frontend Changes**:

- Updated `Toolbar.svelte` with window control buttons (minimize, maximize, close)
- Added custom window drag handler using `invoke('start_drag')`
- Implemented button event filtering to prevent accidental drags

**Backend Changes**:

- Added `start_drag` Rust command to `lib.rs` for reliable window dragging
- Updated `invoke_handler` to register the new command
- Used Tauri's native `window.start_dragging()` method

**Configuration Updates**:

- Modified `tauri.conf.json` to disable window decorations
- Set overlay style for macOS integration
- Added window control permissions to capabilities

**Code Quality Improvements**:

```rust
// Clean Rust command implementation
#[tauri::command]
async fn start_drag(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}
```

```javascript
// Reliable drag handler with button filtering
async function handleDragStart(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return; // Prevent drag on buttons

    await invoke('start_drag');
}
```

**User Experience Impact**:

- **Before**: White OS titlebar conflicting with dark theme, non-draggable window
- **After**: Unified dark theme titlebar, functional window controls, draggable interface
- **Visual Consistency**: Complete theme integration with professional appearance
- **Unique Design**: Hybrid approach combining macOS traffic light aesthetics with Windows-style right positioning

**Creative Design Choice**:

- **Layout**: Traffic light buttons positioned on the right side (Windows-style)
- **Order**: Minimize, Maximize, Close - following Windows convention
- **Aesthetic**: Beautiful macOS circular colored buttons (red, yellow, green)
- **Result**: Unique fusion design that's both familiar and distinctive

**Technical Benefits**:

- Native window behavior maintained through Tauri API
- Reliable drag functionality using Rust commands
- Accessibility compliance with proper ARIA labels
- Consistent hover states and visual feedback

**Files Modified**:

- `src/lib/components/Toolbar.svelte`: Window controls and drag implementation
- `src-tauri/src/lib.rs`: Custom start_drag command
- `src-tauri/tauri.conf.json`: Window decoration and overlay settings
- `src-tauri/capabilities/default.json`: Window control permissions

**Design System Integration**:

- Window control buttons follow existing design patterns
- Hover effects using established color system
- Close button with distinct red hover state for user safety
- Consistent 8px button sizing and spacing

**macOS Traffic Light Enhancement**:

- **Authentic Colors**: Red (#ef4444), Yellow (#eab308), Green (#22c55e) matching macOS system colors
- **Perfect Sizing**: 14px circular buttons (w-3.5 h-3.5) with proportional 10px icons
- **Professional Effects**: Subtle borders (opacity 30%), shadows, and smooth hover transitions
- **Native Layout**: Traffic lights positioned on left side like real macOS applications
- **Hover States**: Icons become visible on hover with darker background colors
- **Active States**: Scale animation (scale-90) on click for tactile feedback

**Code Quality**:

```svelte
// Clean separation of button styles by function
const macOSCloseButtonClass = `w-3.5 h-3.5 bg-red-500 text-transparent hover:bg-red-600 hover:text-red-900 rounded-full`
const macOSMinimizeButtonClass = `w-3.5 h-3.5 bg-yellow-500 text-transparent hover:bg-yellow-600 hover:text-yellow-900 rounded-full`
const macOSMaximizeButtonClass = `w-3.5 h-3.5 bg-green-500 text-transparent hover:bg-green-600 hover:text-green-900 rounded-full`
```

**Accessibility Features**:

- Proper ARIA labels for screen readers
- Keyboard navigation support maintained
- Visual feedback for all interactive elements
- Clear button focus states with accessibility compliance

### Phase 2.10: Semantic Traffic Light Color System (Completed ✅)

**Date**: November 29, 2025

**Goal**: Implement proper semantic color system for traffic light controls using Tailwind v4 best practices

**Architectural Decisions Made**:

1. **Semantic CSS Variables**: Moved from arbitrary color values to proper CSS custom properties
2. **Tailwind v4 @theme Integration**: Added traffic light colors to the centralized theme system
3. **Professional Color Palette**: Refined color choices for elegant, less saturated appearance

**Technical Implementation**:

**CSS Color System**:

```css
/* Traffic light colors in app.css @theme directive */
--color-traffic-red: hsl(5 79% 65%); /* Close button - sophisticated coral */
--color-traffic-yellow: hsl(41 88% 63%); /* Minimize button - elegant golden */
--color-traffic-green: hsl(113 51% 56%); /* Maximize button - modern fresh green */

/* Complete hover state system */
--color-traffic-red-hover: hsl(5 79% 60%);
--color-traffic-red-text: hsl(5 79% 45%);
/* + yellow and green variants */
```

**Component Updates**:

```svelte
// Clean semantic class usage instead of arbitrary values
const macOSCloseButtonClass = `bg-traffic-red hover:bg-traffic-red-hover hover:text-traffic-red-text`
const macOSMinimizeButtonClass = `bg-traffic-yellow hover:bg-traffic-yellow-hover hover:text-traffic-yellow-text`
const macOSMaximizeButtonClass = `bg-traffic-green hover:bg-traffic-green-hover hover:text-traffic-green-text`
```

**Code Quality Improvements**:

- **Before**: Arbitrary values like `bg-[#EC6A5E]` scattered throughout components
- **After**: Semantic classes like `bg-traffic-red` with centralized color management
- **Maintainability**: All traffic light colors defined in one place with consistent naming
- **Type Safety**: Tailwind auto-completion for custom semantic classes

**Color Refinements**:

- **Sophisticated Palette**: Moved from highly saturated defaults to refined, professional colors
- **HSL Color Space**: Proper HSL format for better color manipulation and consistency
- **Visual Harmony**: Colors designed to work elegantly with the existing dark theme
- **Accessibility**: Sufficient contrast while maintaining visual appeal

**User Experience Impact**:

- **Visual Polish**: More refined, elegant appearance with professional color choices
- **Brand Consistency**: Traffic light colors properly integrated into design system
- **Maintainable Design**: Easy to adjust colors globally without touching component code

**Hybrid Design Achievement**:

- **Unique Identity**: macOS traffic light aesthetics with Windows-style right positioning
- **Best of Both Worlds**: Beautiful circular colored buttons with familiar placement
- **Creative Innovation**: Distinctive design that stands out while remaining intuitive

**Files Modified**:

- `src/app.css`: Added semantic traffic light color variables to @theme directive
- `src/lib/components/Toolbar.svelte`: Updated to use semantic class names
- Proper Tailwind v4 implementation following framework best practices

**Technical Benefits**:

- Centralized color management in CSS custom properties
- Clean separation between design tokens and component implementation
- Better developer experience with semantic class names
- Future-proof architecture for easy color theme variations

### Phase 2.11: Advanced Image Coordinate System & Status Bar Integration (Completed ✅)

**Date**: November 30, 2025

**Goal**: Implement accurate coordinate tracking and real-time image metadata display

**Architectural Decisions Made**:

1. **Coordinate System Choice**: Implemented original image pixel coordinate tracking instead of display coordinates
   - **Decision**: Scale display coordinates to original image dimensions using natural width/height
   - **Rationale**: Professional image viewers display actual pixel coordinates for precise work
   - **Implementation**: `scaleX/Y = naturalDimensions / displayDimensions` with rounded coordinate conversion

2. **Shared Image Metadata Store**: Created centralized image metadata management
   - **Architecture**: New `imageMetadata.svelte.ts` store using Svelte 5 runes
   - **Purpose**: Share real-time image dimensions between ImageViewer and StatusBar components
   - **Benefits**: Eliminated hardcoded mock data, automatic aspect ratio and megapixel calculation

3. **Window Drag Interaction Refinement**: Enhanced toolbar drag behavior
   - **Issue**: File operation buttons and UI elements triggering unwanted window drags
   - **Solution**: Added `onmousedown={(e) => e.stopPropagation()}` to prevent drag propagation
   - **Result**: Clean drag behavior only from empty toolbar space

**Technical Implementation**:

**New Store Architecture**:

```typescript
// imageMetadata.svelte.ts - Centralized image metadata management
class ImageMetadata {
	naturalWidth = $state(0);
	naturalHeight = $state(0);
	isLoaded = $state(false);

	get resolution(): string {
		return `${width}x${height}`;
	}
	get ratio(): string {
		/* GCD calculation for simplified ratios */
	}
	get megapixels(): string {
		/* Automatic MP calculation */
	}
}
```

**Coordinate System Enhancement**:

```typescript
// Original image pixel coordinates (professional standard)
const scaleX = imageNaturalWidth / rect.width;
const scaleY = imageNaturalHeight / rect.height;
const originalX = Math.round(x * scaleX);
const originalY = Math.round(y * scaleY);
```

**Component Integration**:

- **ImageViewer**: Updates shared store when image loads, provides accurate coordinate scaling
- **StatusBar**: Displays real image dimensions, calculated ratios, and precise megapixel counts
- **Toolbar**: Refined drag behavior preventing UI element interference

**User Experience Impact**:

- **Before**: Mock hardcoded data (4032x3024, 12.2MP), display-only coordinates
- **After**: Real image data (e.g., 3629x2433, 8.8MP), professional pixel coordinates
- **Professional Workflow**: Coordinates match industry standards for precise image work
- **Visual Polish**: Authentic metadata display with calculated aspect ratios

**Files Created/Modified**:

- `src/lib/stores/imageMetadata.svelte.ts` (NEW): Centralized image metadata management
- `src/lib/components/ImageViewer.svelte`: Coordinate scaling, metadata store integration
- `src/lib/components/StatusBar.svelte`: Real metadata display instead of mock data
- `src/lib/components/Toolbar.svelte`: Drag behavior refinement with event propagation control

**Technical Benefits**:

- **Accuracy**: Real-time image dimensions and calculated metadata
- **Performance**: Reactive updates with Svelte 5 runes efficiency
- **Maintainability**: Centralized metadata management eliminates duplication
- **Professional Standards**: Coordinate system matches industry image viewers

**Design System Integration**:

- Maintained existing professional dark theme and typography
- Preserved traffic light window controls and semantic color system
- Enhanced status bar information hierarchy with real data
- Consistent interaction patterns with refined drag behavior

**Validation Results**:

- ✅ Accurate coordinate display (original image pixel coordinates)
- ✅ Real image dimensions in status bar (resolution, ratio, megapixels)
- ✅ Clean window drag behavior (no interference from UI elements)
- ✅ Reactive metadata updates when switching images
- ✅ Professional metadata calculations (GCD ratios, precise megapixels)

**Key Learnings**:

- Professional image viewers require original pixel coordinates, not display coordinates
- Shared stores with Svelte 5 runes provide excellent cross-component data synchronization
- Event propagation control is crucial for clean desktop app interactions
- Real-time calculated metadata provides much better user experience than mock data

---

### Phase 2.12: Canvas-Based Rendering System (Completed ✅)

**Date**: December 5, 2025

**Objective**: Replace img element with canvas for GPU-accelerated rendering and better performance

**Architectural Decisions Made**:

1. **Canvas Rendering Architecture**: Migrated from img element to canvas for GPU acceleration
   - **Canvas 2D Context**: High-quality rendering with configurable image smoothing
   - **Device Pixel Ratio**: Support for crisp display on high-DPI screens
   - **Performance Optimizations**: Alpha disabled, desynchronized rendering for better GPU utilization

2. **Image Loading Pipeline**: Asynchronous image loading with canvas rendering

   ```typescript
   async function loadImage(src: string): Promise<HTMLImageElement>;
   function initializeCanvas(): CanvasRenderingContext2D | null;
   function resizeCanvas(): void;
   function renderImageToCanvas(img: HTMLImageElement): void;
   ```

3. **Coordinate System Preservation**: Maintained accurate coordinate tracking with canvas
   - Mouse coordinates still map to original image pixels
   - Canvas display coordinates converted to image coordinates
   - Preserved professional coordinate accuracy

**Technical Implementation**:

**Canvas Setup**:

```typescript
// Canvas configuration for optimal rendering
ctx.alpha = false; // Disable alpha for better performance
ctx.desynchronized = true; // Allow desynchronized rendering
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";
```

**Device Pixel Ratio Support**:

```typescript
const devicePixelRatio = window.devicePixelRatio || 1;
canvasElement.width = displayWidth * devicePixelRatio;
canvasElement.height = displayHeight * devicePixelRatio;
canvasElement.style.width = `${displayWidth}px`;
canvasElement.style.height = `${displayHeight}px`;
ctx.scale(devicePixelRatio, devicePixelRatio);
```

**Reactive Effects Integration**:

- Canvas initialization effect for setup and resize handling
- Image loading effect for async image rendering
- Window resize effect for responsive canvas scaling

**Component Integration**:

- **ImageViewer**: Complete migration from img to canvas element
- **Mouse Tracking**: Preserved accurate coordinate mapping
- **Loading States**: Maintained loading indicators and error handling
- **Styling**: Consistent visual appearance with transition effects

**User Experience Impact**:

- **Before**: Standard img element rendering (browser-dependent performance)
- **After**: GPU-accelerated canvas rendering with high-quality smoothing
- **Performance**: Better handling of large images and future zoom/pan operations
- **Quality**: Crisp rendering on high-DPI displays with device pixel ratio support

**Files Modified**:

- `src/lib/components/ImageViewer.svelte`: Complete canvas migration
  - Updated reactive variables (imageElement → canvasElement + canvasContext)
  - Replaced image loading handlers with canvas rendering functions
  - Modified mouse coordinate tracking for canvas element
  - Implemented canvas initialization and resize effects

- `src/lib/stores/fileService.svelte.ts`: Added openFileByPath method
  - New method for programmatic file loading by path
  - Maintains same validation and error handling as dialog-based loading

- `src/routes/+page.svelte`: Auto-load functionality for development
  - Automatic test image loading after 2 seconds for rapid development iteration

**Technical Benefits**:

- **GPU Acceleration**: Canvas 2D context utilizes GPU for better performance
- **High DPI Support**: Device pixel ratio scaling for crisp display on retina screens
- **Future-Ready**: Canvas foundation enables zoom, pan, rotation, and other advanced features
- **Performance**: Better memory management and rendering pipeline control
- **Quality**: High-quality image smoothing and professional rendering

**Development Workflow Enhancements**:

- **Auto-Loading**: Test image automatically loads for faster development iteration
- **Comprehensive Logging**: Canvas operations logged for debugging and optimization
- **Real-time Monitoring**: Canvas render size logging for performance analysis

**Design System Integration**:

- Maintained existing visual design and interaction patterns
- Preserved professional dark theme and styling
- Canvas styling matches previous img element appearance
- Smooth transition effects and loading states

**Validation Results**:

- ✅ Canvas rendering working with GPU acceleration
- ✅ Accurate coordinate tracking preserved
- ✅ High-quality image smoothing enabled
- ✅ Device pixel ratio support for crisp display
- ✅ Real-time canvas resizing with window changes
- ✅ Auto-load functionality for rapid development

**Key Learnings**:

- Canvas 2D context provides significant performance improvements for image rendering
- Device pixel ratio handling is essential for crisp display on modern screens
- Canvas foundation enables future advanced image manipulation features
- Asynchronous image loading with canvas requires careful state management

**Deliverable**: ✅ High-performance canvas-based image rendering with GPU acceleration, device pixel ratio support, and development workflow enhancements

---

### Phase 3.1: Apple Preview-Style Zoom System (Completed ✅)

**Date**: December 5, 2025

**Objective**: Implement zoom and pan functionality matching Apple Preview's behavior

**Research & Design Decisions**:

1. **Zoom-to-Cursor Behavior**: After researching Apple Preview's actual behavior (via user testing), confirmed that Preview zooms to the cursor position when using pinch/wheel gestures, not to the image center as some documentation suggested.

2. **Zoom Architecture**: Created dedicated `zoomStore.svelte.ts` following the project's Svelte 5 runes pattern for centralized zoom state management.

3. **Boundary Clamping**: Implemented edge-to-edge boundary clamping - image edges cannot be dragged past viewport edges, matching professional image viewer behavior.

**Technical Implementation**:

**New Store: `zoomStore.svelte.ts`**

```typescript
class ZoomState {
	scale = $state(1); // Current zoom level (1 = 100%)
	offsetX = $state(0); // Pan offset X
	offsetY = $state(0); // Pan offset Y
	mode = $state<"fit" | "actual" | "free">("fit");

	// Key methods
	zoomToPoint(zoomIn: boolean, cursorX: number, cursorY: number);
	setFitToWindow();
	setActualSize();
	pan(deltaX: number, deltaY: number);
	clampOffset();
}
```

**Zoom-to-Cursor Mathematics**:

```typescript
// When zooming, keep the point under cursor fixed
const scaleRatio = newScale / oldScale;
const newOffsetX = cursorX - (cursorX - oldOffsetX) * scaleRatio;
const newOffsetY = cursorY - (cursorY - oldOffsetY) * scaleRatio;
```

**Boundary Clamping Logic**:

```typescript
// Image smaller than container: center it
// Image larger than container: clamp to edges
if (scaledWidth <= containerWidth) {
	offsetX = (containerWidth - scaledWidth) / 2;
} else {
	offsetX = Math.max(containerWidth - scaledWidth, Math.min(0, offsetX));
}
```

**Component Updates**:

1. **ImageViewer.svelte**:
   - Integrated zoom store for scale/offset transforms
   - Added wheel event handler for zoom-to-cursor
   - Added mouse drag handlers for panning
   - Updated `renderImageToCanvas()` to apply zoom transforms
   - Updated coordinate tracking to account for zoom/pan
   - Dynamic cursor feedback (grab/grabbing/crosshair)

2. **Toolbar.svelte**:
   - Added zoom control buttons (Zoom In, Zoom Out, Fit, 100%)
   - Integrated zoom store for button state (disabled when at limits)
   - Added Lucide icons (ZoomIn, ZoomOut, Maximize, Square)

3. **StatusBar.svelte**:
   - Added zoom percentage display
   - Real-time updates as user zooms

**Zoom Specifications**:

- **Zoom Range**: 10% to 1000% (0.1x to 10x)
- **Zoom Step**: 1.15x per wheel tick (multiplicative, smooth feel)
- **Zoom Modes**: Fit-to-window, Actual size (100%), Free zoom
- **Pan Behavior**: Only when image > viewport, with boundary clamping

**Files Created/Modified**:

- `src/lib/stores/zoomStore.svelte.ts` (NEW): Centralized zoom state management
- `src/lib/components/ImageViewer.svelte`: Zoom/pan rendering, wheel handler, drag handlers
- `src/lib/components/Toolbar.svelte`: Zoom control buttons
- `src/lib/components/StatusBar.svelte`: Zoom percentage display
- `src/lib/icons/index.ts`: Added ZoomIn, ZoomOut, Maximize, Square exports

**User Experience**:

- **Zoom**: Pinch gesture or Cmd+scroll zooms centered on cursor position (Apple Preview style)
- **Scroll**: Trackpad scroll (vertical/horizontal) pans the image
- **Pan**: Click and drag when zoomed in (cursor shows grab/grabbing)
- **Fit**: Click toolbar button to fit image to window
- **100%**: Click toolbar button to show actual pixel size
- **Feedback**: Zoom percentage shown in status bar, cursor changes based on state

**Validation Results**:

- ✅ Zoom-to-cursor working correctly
- ✅ Pan/drag with boundary clamping
- ✅ Fit-to-window and actual size modes
- ✅ Zoom percentage display in status bar
- ✅ Coordinate tracking accurate with zoom/pan transforms
- ✅ Toolbar buttons with proper disabled states
- ✅ Cursor feedback (grab/grabbing/crosshair)

**Key Learnings**:

- Apple Preview actually zooms to cursor position, not center (verified by testing)
- Multiplicative zoom steps (1.15x) feel more natural than additive
- Boundary clamping requires different logic for "image smaller than container" vs "larger"
- Zoom state should be in a dedicated store for cross-component access
- Canvas transforms (scale + translate) are simpler than recalculating draw coordinates

**Deliverable**: ✅ Professional Apple Preview-style zoom system with zoom-to-cursor, pan/drag, boundary clamping, and toolbar controls

---

### Phase 3.1.1: Smooth Animated Transitions (Completed ✅)

**Date**: December 5, 2025

**Objective**: Add smooth animated transitions for toolbar zoom controls (Fit, 100%, Zoom In/Out)

**Problem Identified**: Initial implementation had instant zoom changes for toolbar buttons, while pinch/scroll felt smooth. User requested Apple Preview-like smooth transitions.

**Technical Implementation**:

**1. Animation System in ImageViewer**:

```typescript
// Animation state
let animationFrameId: number | null = null;
let isAnimating = $state(false);
const ANIMATION_DURATION = 250; // ms

// Easing function (ease-out cubic for smooth deceleration)
function easeOutCubic(t: number): number {
	return 1 - Math.pow(1 - t, 3);
}

// Animate zoom transition
function animateZoomTo(targetScale, targetOffsetX, targetOffsetY) {
	isAnimating = true;
	const startTime = performance.now();

	function animate(currentTime) {
		const progress = Math.min((currentTime - startTime) / ANIMATION_DURATION, 1);
		const easedProgress = easeOutCubic(progress);

		// Interpolate values
		zoomState.scale = lerp(startScale, targetScale, easedProgress);
		zoomState.offsetX = lerp(startOffsetX, targetOffsetX, easedProgress);
		zoomState.offsetY = lerp(startOffsetY, targetOffsetY, easedProgress);

		renderImageToCanvas(currentImage);

		if (progress < 1) {
			requestAnimationFrame(animate);
		} else {
			isAnimating = false;
		}
	}
	requestAnimationFrame(animate);
}
```

**2. Command-Based Toolbar Communication**:

Added command queue system to zoomStore for toolbar-to-ImageViewer communication:

```typescript
// In zoomStore.svelte.ts
type ZoomCommand = "zoomIn" | "zoomOut" | "fitToWindow" | "actualSize" | null;
pendingCommand = $state<ZoomCommand>(null);

requestZoomIn() { this.pendingCommand = "zoomIn"; }
requestZoomOut() { this.pendingCommand = "zoomOut"; }
requestFitToWindow() { this.pendingCommand = "fitToWindow"; }
requestActualSize() { this.pendingCommand = "actualSize"; }
```

ImageViewer listens for commands and executes with animation:

```typescript
$effect(() => {
	const command = zoomState.pendingCommand;
	if (!command || !imageLoaded) return;
	zoomState.clearCommand();

	switch (command) {
		case "zoomIn":
			zoomIn();
			break;
		case "zoomOut":
			zoomOut();
			break;
		case "fitToWindow":
			fitToWindow();
			break;
		case "actualSize":
			actualSize();
			break;
	}
});
```

**3. Scroll Behavior Refinement**:

Changed input behavior to match Apple Preview:

- **Trackpad scroll** (deltaX/deltaY) → Pan the image
- **Pinch gesture** (ctrlKey + wheel) → Zoom to cursor
- **Cmd + scroll** (metaKey + wheel) → Zoom to cursor

```typescript
function handleWheel(event: WheelEvent) {
	const isZoomGesture = event.ctrlKey || event.metaKey;

	if (isZoomGesture) {
		// Zoom to cursor
		zoomState.zoomToPoint(event.deltaY < 0, cursorX, cursorY);
	} else {
		// Pan with natural scrolling
		zoomState.pan(-event.deltaX, -event.deltaY);
	}
}
```

**4. Zoom Speed Tuning**:

Refined zoom steps for better control:

- **Pinch/scroll**: 1.025x (2.5% per tick) - smooth, precise control
- **Toolbar buttons**: 1.25x (25% per click) - noticeable change per click

**Key Challenges Solved**:

1. **Animation/Effect Conflict**: Re-render effect was interfering with animation by also calling render. Fixed by adding `isAnimating` flag and skipping effect during animation.

2. **Fit Mode Instant Reset**: `resizeCanvas()` was calling `setFitToWindow()` instantly when mode was 'fit'. Fixed by checking `!isAnimating` before instant updates.

3. **Mode Setting Order**: Setting `zoomState.mode` before animation could trigger unwanted effects. Fixed by setting mode after starting animation.

**Files Modified**:

- `src/lib/stores/zoomStore.svelte.ts`: Added command queue system, ZoomCommand type
- `src/lib/components/ImageViewer.svelte`: Animation system, command listener, scroll behavior
- `src/lib/components/Toolbar.svelte`: Use request methods instead of direct calls

**Validation Results**:

- ✅ Fit to Window - smooth 250ms eased animation
- ✅ Actual Size (100%) - smooth 250ms eased animation
- ✅ Zoom In button - smooth 250ms eased animation
- ✅ Zoom Out button - smooth 250ms eased animation
- ✅ Pinch/Cmd+scroll - instant responsive zoom (no animation needed)
- ✅ Trackpad scroll - smooth panning
- ✅ No animation conflicts or visual glitches

**User Experience Impact**:

- **Before**: Toolbar buttons caused jarring instant jumps
- **After**: Smooth, professional transitions matching Apple Preview quality
- **Scroll behavior**: Natural - scroll pans, pinch zooms (matches user expectation)

**Deliverable**: ✅ Polished zoom system with smooth animated transitions for all toolbar controls

---

### Phase 3.2: Image Navigation (Completed ✅)

**Date**: December 5, 2025

**Objective**: Implement folder-based image navigation with keyboard shortcuts and preloading

**Technical Implementation**:

**1. Navigation Store (`navigationStore.svelte.ts`)**:

New Svelte 5 runes-based store for navigation state:

```typescript
class NavigationStore {
	images = $state<string[]>([]); // All images in folder
	currentIndex = $state(-1); // Current position
	currentFolder = $state<string | null>(null);
	isScanning = $state(false);

	// Derived values
	get totalImages(): number;
	get canGoNext(): boolean;
	get canGoPrev(): boolean;
	get positionText(): string; // "3 / 25"

	// Navigation methods
	async scanFolder(filePath: string): Promise<void>;
	goNext(): string | null;
	goPrev(): string | null;
	goFirst(): string | null;
	goLast(): string | null;

	// Preloading
	private preloadAdjacent(): void;
}
```

**2. Folder Scanning**:

Uses Tauri's `readDir` API to scan folder when image opens:

```typescript
async scanFolder(filePath: string) {
	const entries = await readDir(folderPath);

	// Filter for supported image formats
	const imageFiles = entries
		.filter((e) => e.isFile && SUPPORTED_FORMATS.includes(getExtension(e.name)))
		.map((e) => joinPath(folderPath, e.name));

	// Sort alphabetically (natural sort for numbers)
	imageFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

	this.images = imageFiles;
	this.currentIndex = imageFiles.findIndex((p) => getFileName(p) === fileName);
}
```

**3. Adjacent Image Preloading**:

Preloads next/previous images into browser cache for instant navigation:

```typescript
private preloadAdjacent(): void {
	if (this.currentIndex < this.images.length - 1) {
		const nextUrl = convertFileSrc(this.images[this.currentIndex + 1]);
		new Image().src = nextUrl; // Browser caches it
	}
	if (this.currentIndex > 0) {
		const prevUrl = convertFileSrc(this.images[this.currentIndex - 1]);
		new Image().src = prevUrl;
	}
}
```

**4. Keyboard Navigation**:

Global keyboard handler in `+page.svelte`:

```typescript
function handleKeydown(event: KeyboardEvent) {
	switch (event.key) {
		case "ArrowLeft":
			navStore.goPrev();
			break;
		case "ArrowRight":
			navStore.goNext();
			break;
		case "Home":
			navStore.goFirst();
			break;
		case "End":
			navStore.goLast();
			break;
	}
}
```

**5. FileService Integration**:

Modified to trigger folder scan and support navigation:

```typescript
async openFileByPath(filePath: string, skipFolderScan = false) {
	// ... load file ...

	// Trigger folder scan (unless navigating)
	if (!skipFolderScan) {
		navStore.scanFolder(filePath);
	}
}
```

**Files Created/Modified**:

- `src/lib/stores/navigationStore.svelte.ts` (NEW): Navigation state management
- `src/lib/stores/fileService.svelte.ts`: Folder scan integration, skipFolderScan parameter
- `src/lib/components/Toolbar.svelte`: Prev/Next buttons with ChevronLeft/Right icons
- `src/lib/components/StatusBar.svelte`: Position indicator ("3 / 25")
- `src/routes/+page.svelte`: Keyboard event handler

**User Experience**:

| Input      | Action                  |
| ---------- | ----------------------- |
| ← Arrow    | Previous image          |
| → Arrow    | Next image              |
| Home       | First image in folder   |
| End        | Last image in folder    |
| Toolbar ‹  | Previous image          |
| Toolbar ›  | Next image              |
| Status bar | Shows "3 / 25" position |

**Performance Features**:

- **Preloading**: Adjacent images loaded in background for instant display
- **Efficient scanning**: Single folder scan, cached until new file opened
- **Natural sorting**: Numbers sorted correctly (img2 < img10)

**Validation Results**:

- ✅ Folder scanning finds all supported image formats
- ✅ Navigation buttons enabled/disabled correctly
- ✅ Keyboard shortcuts work (arrows, Home, End)
- ✅ Position indicator updates in real-time
- ✅ Preloading makes navigation feel instant
- ✅ Alphabetical sorting with numeric awareness

**Deliverable**: ✅ Complete image navigation system with folder scanning, keyboard shortcuts, toolbar buttons, position indicator, and preloading

---

### Phase 3.2.5: WebGL Rendering Migration (Completed ✅)

**Date**: December 5, 2025

**Objective**: Migrate from Canvas 2D to WebGL for improved zoom/pan performance while maintaining full feature parity

**Architectural Decisions Made**:

1. **Step-by-Step Implementation Strategy**: Instead of attempting full feature parity immediately, implemented incrementally:
   - Step 1: Basic static image rendering
   - Step 2: Add zoom (scale uniform)
   - Step 3: Add pan (offset uniform)
   - Step 4: Add zoom-to-cursor
   - Step 5: Add smooth animations

2. **Standalone WebGLRenderer Class**: Created imperative WebGL class separate from Svelte reactivity
   - **Rationale**: WebGL context lifecycle doesn't mix well with Svelte's reactive system
   - **Pattern**: Pure imperative class, ImageViewer calls methods directly
   - **Benefits**: No reactive loops, predictable initialization, easier debugging

3. **Preservation of Canvas 2D Implementation**: Kept old implementation as `ImageViewer.old.svelte` for reference

**Technical Implementation**:

**1. WebGLRenderer Class (`src/lib/utils/WebGLRenderer.ts`)**:

```typescript
class WebGLRenderer {
	private gl: WebGLRenderingContext | null = null;
	private program: WebGLProgram | null = null;
	private texture: WebGLTexture | null = null;

	// Uniforms: u_resolution, u_scale, u_offset, u_imageSize
	// Attributes: a_position, a_texCoord

	init(canvas: HTMLCanvasElement): boolean;
	resize(width: number, height: number, dpr: number): void;
	loadImage(img: HTMLImageElement): boolean;
	render(scale: number, offsetX: number, offsetY: number): void;
	destroy(): void;
}
```

**Key Features**:

- Vertex shader: Transforms unit quad with scale/offset uniforms
- Fragment shader: Samples texture with proper coordinate mapping
- Texture management: Creates/deletes textures, handles non-power-of-2 images
- Buffer management: Static position and texture coordinate buffers

**2. Shader Implementation**:

```glsl
// Vertex shader - applies zoom and pan transforms
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform vec2 u_resolution;
uniform float u_scale;
uniform vec2 u_offset;
uniform vec2 u_imageSize;

void main() {
    vec2 position = a_position * u_imageSize * u_scale + u_offset;
    vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texCoord = a_texCoord;
}

// Fragment shader - samples texture
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;

void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
}
```

**3. ImageViewer Migration**:

**Initialization**:

- Used `onMount` instead of `$effect` to avoid reactive loops
- WebGL context created once, stored in non-reactive variable
- Proper cleanup on unmount

**State Management**:

- Zoom/pan state stored in non-reactive variables (`currentScale`, `currentOffsetX`, `currentOffsetY`)
- Manual re-renders via `render()` function
- Avoided Svelte reactivity for WebGL operations

**Image Loading**:

- Integrated with `navigationStore` caching system
- Uses `getCachedImage()` for instant navigation
- Sets `crossOrigin = "anonymous"` for WebGL texture compatibility

**4. ViewerControls Store (`src/lib/stores/viewerControls.svelte.ts`)**:

New bridge store for Toolbar ↔ ImageViewer communication:

```typescript
class ViewerControls {
	// Registered functions from ImageViewer
	private _fitToWindow: ZoomFunction | null = null;
	private _actualSize: ZoomFunction | null = null;
	private _zoomIn: ZoomFunction | null = null;
	private _zoomOut: ZoomFunction | null = null;

	// Reactive state for UI
	zoomPercentage = $state(100);
	isRegistered = $state(false);

	register(fns: {...}): void;
	unregister(): void;
	updateZoom(percentage: number): void;
}
```

**Benefits**: Clean separation, no component binding complexity, reactive zoom percentage for status bar

**5. Feature Parity Achievements**:

- ✅ **Zoom-to-Cursor**: Pinch/Cmd+scroll zooms to cursor position
- ✅ **Panning**: Scroll panning and mouse drag panning
- ✅ **Boundary Clamping**: Image edges can't go past viewport
- ✅ **Smooth Animations**: 250ms ease-out cubic transitions for toolbar buttons
- ✅ **Mouse Coordinates**: Real-time coordinate tracking for status bar
- ✅ **Toolbar Integration**: All zoom buttons work with animations
- ✅ **Status Bar**: Zoom percentage and coordinates display
- ✅ **Navigation**: Compatible with image navigation system
- ✅ **Image Caching**: Uses preloaded images for instant navigation

**6. Critical Fixes**:

**CORS/SecurityError Fix**:

- **Issue**: WebGL requires `crossOrigin = "anonymous"` for textures
- **Solution**: Added to both `loadImage()` in ImageViewer and `preloadImage()` in navigationStore
- **Impact**: Preloaded images now work with WebGL rendering

**Reactive Loop Prevention**:

- **Issue**: Initial attempt used `$effect` for WebGL init, causing infinite loops
- **Solution**: Used `onMount` for one-time initialization, manual state management
- **Pattern**: Non-reactive variables for WebGL state, reactive only for UI updates

**Mouse Coordinate Tracking**:

- **Issue**: Coordinate display wasn't working after migration
- **Solution**: Added `updateMouseCoords()` function converting canvas coords to image coords
- **Implementation**: Accounts for zoom/pan transforms: `imgX = (canvasX - offsetX) / scale`

**Files Created/Modified**:

- `src/lib/utils/WebGLRenderer.ts` (NEW): Standalone WebGL rendering class
- `src/lib/stores/viewerControls.svelte.ts` (NEW): Toolbar ↔ ImageViewer bridge
- `src/lib/components/ImageViewer.svelte`: Complete WebGL migration
- `src/lib/components/ImageViewer.old.svelte` (NEW): Preserved Canvas 2D implementation
- `src/lib/components/Toolbar.svelte`: Updated to use viewerControls store
- `src/lib/components/StatusBar.svelte`: Updated to use viewerControls.zoomPercentage
- `src/lib/stores/navigationStore.svelte.ts`: Added crossOrigin to preloadImage()

**Performance Improvements**:

- **GPU Acceleration**: WebGL utilizes GPU for all rendering operations
- **Efficient Transforms**: Uniform-based transforms (no CPU-side calculations per frame)
- **Texture Caching**: Images uploaded once to GPU, reused for all renders
- **Smooth 60fps**: Maintained smooth animations even with large images

**User Experience**:

- **Before**: Canvas 2D rendering (good, but CPU-bound)
- **After**: WebGL GPU-accelerated rendering (smoother, especially for zoom/pan)
- **Feature Parity**: All existing features work identically
- **Performance**: Noticeably smoother zoom/pan operations, especially on large images

**Validation Results**:

- ✅ WebGL initialization successful
- ✅ Image rendering working correctly
- ✅ Zoom-to-cursor behavior matches Canvas 2D
- ✅ Panning (scroll and drag) working
- ✅ Smooth animations for toolbar buttons
- ✅ Mouse coordinates accurate
- ✅ Toolbar buttons functional
- ✅ Status bar displays zoom percentage
- ✅ Navigation system compatible
- ✅ Image caching working with WebGL
- ✅ No reactive loops or initialization issues

**Key Learnings**:

- **WebGL + Svelte**: Keep WebGL operations imperative, use Svelte reactivity only for UI state
- **Initialization**: Use `onMount` for one-time setup, avoid `$effect` for WebGL context
- **CORS**: Always set `crossOrigin = "anonymous"` for images used in WebGL textures
- **Step-by-Step**: Incremental implementation prevents overwhelming complexity
- **State Management**: Non-reactive variables for WebGL state, reactive for UI updates
- **Bridge Pattern**: Store-based communication cleaner than component binding for complex integrations

**Technical Debt Resolved**:

- Proper WebGL context lifecycle management
- Eliminated reactive loops with WebGL initialization
- Fixed CORS issues for cached images
- Clean separation between WebGL operations and Svelte reactivity

**Deliverable**: ✅ GPU-accelerated WebGL rendering system with full feature parity, smooth animations, and seamless integration with all existing systems

### GPU Texture Caching Optimization (December 12, 2025)

- Implemented a path-keyed GPU texture cache in `WebGLRenderer` so that images are uploaded via `texImage2D` only once per image (up to a small cache size).
- `loadImage(img, key)` now:
  - Reuses an existing `WebGLTexture` on cache hits (binds texture only, no re-upload).
  - Uploads a new texture and stores it in a FIFO cache on cache misses.
  - Emits PERF logs with `cached` and `cacheSize` flags for clear analysis.
- Added cache-aware cleanup in `destroy()` to delete all cached textures when the WebGL context is torn down.
- Added `NavigationStore.getAdjacentPaths()` and `WebGLRenderer.prewarmTexture()` integration from `ImageViewer` so adjacent images are pre-uploaded to the GPU while viewing the current image.
- Updated `ImageViewer` to throttle GPU prewarming via a small queue, uploading at most one texture per animation frame and canceling queued work on navigation.
- Updated `WebGLRenderer` eviction logic to never delete the currently displayed texture.
- Added explicit log events for prewarm queue lifecycle (enqueue/cancel/step/retry) and GPU cache eviction decisions to validate correctness and throttling from console output.
- Updated `logTauri()` to append the provided `data` payload (compact JSON) to the Rust-side log message so the terminal output contains the full structured metadata.
- Added `openFileByPath` request sequencing so only the latest navigation request can update `currentFile`, clear loading flags, and emit success logs (prevents out-of-order async completion from causing mismatched file logs/rendering).
- Switched decoded image caching from `HTMLImageElement` to `ImageBitmap` and decode preloads to a display-sized target (viewer width × DPR × factor), reducing both decode overhead and `texImage2D` upload cost.
- Tuned the display-sized decode target multiplier down to `1.25` and added in-flight bitmap decode de-duplication so preloading and foreground loads join the same decode instead of doing redundant work.
- Added a full-resolution texture upgrade path with a status bar "Loading full resolution..." indicator (animated dots) while the full-res fetch/decode/upload runs in the background.
- Status bar image metadata and mouse coordinates now avoid displaying downscaled preview dimensions; coordinates are mapped to the original pixel space once full-res dimensions are known.
- The preview decode path now avoids upscaling small/medium images (clamps resizeWidth to original width) and skips scheduling full-res upgrade when the initial decode already matches full resolution.
- Deferred GPU prewarm scheduling and auto full-res upgrades further into idle time and aligned the preload decode target with the viewer decode target to reduce post-navigation stutter.
- The upgrade is auto-scheduled after first render (debounced/idle) and is also triggered by zoom button actions.
- Updated `WebGLRenderer` to accept `TexImageSource` so it can upload `ImageBitmap` directly.
- Parametrized the development auto-load test image path via `PUBLIC_DEV_AUTOLOAD_IMAGE_PATH` and skip auto-load when unset.
- Added env-controlled preview modes (`PUBLIC_PREVIEW_MODE`: off/aggressive/progressive) that reduce initial GPU upload cost for large images by capping decode size (aggressive) or decoding a small stage-1 preview and upgrading to a larger stage-2 preview during idle time (progressive).
- Added explicit log events for progressive preview mode so terminal output clearly shows stage-1 sizing, stage-2 scheduling/start, and stage-2 completion.
- Implemented non-destructive image transforms (rotate left/right in 90° steps and horizontal/vertical flips) using WebGL shader uniforms, wired through `viewerControls` and the toolbar, while keeping zoom/pan and mouse-to-original-pixel mapping accurate.
- Updated zoom controls so `Actual Size` and zoom in/out actions preserve the current viewport framing (anchor zoom around the viewport center) instead of re-centering the image on every action.
- Implemented OS file association handling for common image formats via `tauri.conf.json` `bundle.fileAssociations`, and added a Rust `RunEvent::Opened` handler that emits a `file-opened` event consumed by the frontend to open the path via `FileService.openFileByPath`.
- Fixed the file-association cold-start race by queuing opened file paths on the Rust side and draining them on frontend startup (via a `take_pending_open_files` command) before registering the live `file-opened` listener.
- Added a zoom minimap overlay in `ImageViewer` that appears when zoomed beyond fit-to-window, renders a small thumbnail with the current rotation/flip applied, shows the current viewport rectangle, and supports click/drag to pan.
- Added a `PUBLIC_MINIMAP_ENABLED` feature flag (defaults to true) to allow disabling the minimap via environment configuration.
- Expanded image format support from 9 to 25+ formats including HEIC/HEIF, AVIF, JPEG XL, SVG, ICO, ICNS, PSD, TGA, OpenEXR, HDR, PICT, QOI, JNG, and MNG, with corresponding OS file associations and dimension parsing where feasible.
- Fixed SVG rendering by implementing `convertSvgToBitmap()` function that renders SVG to Canvas before converting to ImageBitmap for WebGL texture upload, resolving browser limitations with direct SVG-to-ImageBitmap conversion.
- Implemented comprehensive color picker feature with dual modes: pointer mode samples single pixel color at cursor position, select mode allows drag-to-select rectangular areas and computes average color of selection.
- Created `colorConverter.ts` utility with color space conversions (RGB ↔ HSL, HSV, OKLab, OKLch) and formatting functions for multiple color representations.
- Created `colorPicker.svelte.ts` store to manage color picker state including current color, format, selection mode, and selection rectangle geometry.
- Implemented pixel sampling via WebGL `readPixels()` for accurate color extraction from rendered canvas, with proper coordinate transformation accounting for zoom/pan/rotation/flip transforms.
- Implemented area color averaging by sampling multiple pixels within selection rectangle and computing mean RGB values.
- Added selection mode toggle to Toolbar with visual feedback (highlighted when in select mode), allowing users to switch between pointer navigation and area selection.
- Integrated color display into StatusBar showing color swatch and formatted value, with click-to-toggle format cycling through RGB → HSL → HSV → OKLab → OKLch → RGB.
- Added selection rectangle overlay rendering with semi-transparent fill, border, and corner handles for visual feedback during area selection.
- Effect: Navigating back to or forward into recently viewed large images no longer pays the full `texImage2D` cost on first visible visit, significantly reducing perceived latency for back/forward navigation.

### Phase 3.4: Advanced Selection System Implementation (Completed ✅)

**Date**: January 26, 2026  
**Duration**: ~4 hours  
**Context**: Professional selection system with interactive resize/move capabilities and improved UX

**Major Enhancements Implemented**:

**1. Interactive Selection Rectangle System**

- Replaced canvas-based selection drawing with overlay div approach for better performance
- Implemented macOS Preview-style dashed white border with semi-transparent fill
- Added corner handle indicators (6px squares) for resize interaction points
- Created comprehensive selection state management using Svelte 5 runes

**2. Advanced Resize and Move Operations**

- Implemented corner-based resizing from all four corners (NW, NE, SW, SE)
- Added move operation when dragging inside selection area
- Proper cursor feedback system:
  - Crosshair cursor for new selections
  - Move cursor when hovering inside selection
  - Resize cursors (nwse-resize, nesw-resize) for corner handles
- Real-time coordinate transformation between canvas and image space

**3. Selection Bounds Management**

- Implemented comprehensive bounds checking to prevent selections outside image boundaries
- Added `clampToImageBounds()` function for coordinate validation
- Smart resize logic that maintains minimum 1px size and prevents invalid selections
- Move operations keep entire selection within image bounds

**4. Enhanced User Experience**

- Removed automatic selection clearing on mouse leave - selections persist when using toolbar
- Added Escape key support for explicit selection clearing
- Selection persists during toolbar interactions and mode switches
- New selection automatically replaces previous selection (standard behavior)

**5. Toolbar Mode Separation**

- Replaced single toggle button with separate Pointer and Select mode buttons
- Clear visual feedback with only active mode highlighted
- Improved UX with explicit mode selection rather than ambiguous toggle
- Added descriptive tooltips for each mode's purpose

**6. Technical Architecture Improvements**

- Created `SelectionHandle` type system for type-safe handle detection
- Implemented `getSelectionHandle()` function for precise interaction detection
- Added `updateSelectionCursor()` for dynamic cursor management
- Comprehensive logging system for debugging selection operations
- Proper event handling with drag state management

**Key Files Modified**:

- `src/lib/components/ImageViewer.svelte`:
  - Added selection overlay div with dashed border styling
  - Implemented comprehensive mouse event handling for selection operations
  - Added bounds checking and coordinate transformation functions
  - Enhanced cursor management system
- `src/lib/components/Toolbar.svelte`:
  - Replaced toggle button with separate mode buttons
  - Added `handlePointerMode()` and `handleSelectMode()` functions
  - Updated button styling and tooltips
- `src/lib/icons/index.ts`:
  - Added `SquareDashed` icon export for selection mode

**Technical Implementation Details**:

**Selection State Management**:

```typescript
type SelectionHandle = "nw" | "ne" | "sw" | "se" | "move" | null;
let activeHandle = $state<SelectionHandle>(null);
let dragStartX = 0;
let dragStartY = 0;
let selectionStartX = 0;
let selectionStartY = 0;
let selectionStartW = 0;
let selectionStartH = 0;
```

**Bounds Checking Logic**:

```typescript
function clampToImageBounds(x: number, y: number): { x: number; y: number } {
	if (!imageMetadata.isLoaded) return { x, y };

	const clampedX = Math.max(0, Math.min(x, imageMetadata.naturalWidth));
	const clampedY = Math.max(0, Math.min(y, imageMetadata.naturalHeight));

	return { x: clampedX, y: clampedY };
}
```

**Resize Operation Logic**:

- Each corner handle moves independently while opposite corner stays fixed
- Minimum size enforcement (1px) prevents selection disappearance
- Image boundary clamping ensures selections stay within valid area
- Proper coordinate transformation maintains accuracy across zoom levels

**User Experience Improvements**:

- **Before**: Confusing toggle button, selections cleared on mouse leave, no resize capability
- **After**: Clear mode separation, persistent selections, full resize/move interaction
- **Visual Consistency**: macOS Preview-style selection appearance and behavior
- **Professional Feel**: Smooth interactions, proper cursors, intuitive controls

**Performance Optimizations**:

- Overlay div approach reduces canvas redraw overhead
- Efficient coordinate transformation calculations
- Minimal state updates through Svelte 5 reactivity
- Optimized event handling with proper drag state management

**Next Steps Ready**:
Selection system foundation complete and ready for area color averaging implementation and advanced editing features.

---

_Last Updated: January 26, 2026_  
_Current Phase: 3.4 - Advanced Selection System (COMPLETED ✅)_  
_Next Milestone: Phase 3.3 - Full-Screen & Presentation_
