<script>
  import '../app.css';
  
  let { children } = $props();
</script>

<div class="bg-brand-dark text-brand-white antialiased">
  {@render children()}
</div>
