<script lang="ts">
	// Simple counter using Svelte 5 runes directly without external store
	let count = $state(0);

	function increment() {
		count++;
	}

	function decrement() {
		count--;
	}

	function reset() {
		count = 0;
	}
</script>

<div class="simple-counter">
	<h3>Simple Counter</h3>
	<div class="counter-display">
		{count}
	</div>
	<div class="buttons">
		<button onclick={decrement}>-</button>
		<button onclick={reset}>Reset</button>
		<button onclick={increment}>+</button>
	</div>
</div>

<style>
	.simple-counter {
		text-align: center;
		padding: 2rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.counter-display {
		font-size: 2rem;
		margin: 1rem 0;
		padding: 1rem;
		background: #f0f0f0;
		border-radius: 4px;
	}

	.buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}

	button:hover {
		background: #e0e0e0;
	}
</style>
