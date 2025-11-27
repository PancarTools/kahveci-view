<script lang="ts">
  import FileExplorer from "../lib/components/FileExplorer.svelte";
  import ImageViewer from "../lib/components/ImageViewer.svelte";
</script>

<main class="container">
  <header class="header">
    <h1>Kahveci View</h1>
    <p class="subtitle">Modern Image Viewer</p>
  </header>

  <div class="main-content">
    <div class="sidebar">
      <FileExplorer />
    </div>
    
    <div class="viewer-area">
      <ImageViewer />
    </div>
  </div>
</main>

<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: #0f0f0f;
  background-color: #f6f6f6;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.container {
  margin: 0;
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  color: #2c3e50;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 1.1rem;
  font-weight: 400;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1rem;
  min-height: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  min-width: 350px;
}

.viewer-area {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .sidebar {
    min-width: unset;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  .header h1 {
    color: #ecf0f1;
  }

  .subtitle {
    color: #bdc3c7;
  }
}
</style>
