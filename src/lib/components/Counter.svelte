<script lang="ts">
	import { getCounter } from "../stores/counter.svelte";

	// Get the default counter instance
	const counter = getCounter();
</script>

<div class="counter-container">
	<h2>Counter Component</h2>
	<div class="counter-display">
		<span class="counter-value">{counter.count}</span>
	</div>
	
	<div class="counter-controls">
		<button class="counter-btn counter-btn--decrement" onclick={() => counter.decrement()}>
			-
		</button>
		<button class="counter-btn counter-btn--reset" onclick={() => counter.reset()}>
			Reset
		</button>
		<button class="counter-btn counter-btn--increment" onclick={() => counter.increment()}>
			+
		</button>
	</div>

	<div class="counter-input-section">
		<input 
			type="number" 
			placeholder="Set value..." 
			onchange={(e) => {
				const value = parseInt(e.currentTarget.value);
				if (!isNaN(value)) {
					counter.setValue(value);
					e.currentTarget.value = '';
				}
			}}
		/>
	</div>
</div>

<style>
	.counter-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		max-width: 400px;
		margin: 0 auto;
		background: linear-gradient(135deg, #f8f9fa, #e9ecef);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.counter-display {
		font-size: 3rem;
		font-weight: bold;
		color: #2c3e50;
		background: white;
		border-radius: 50%;
		width: 120px;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3px solid #3498db;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.counter-value {
		transition: all 0.3s ease;
	}

	.counter-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.counter-btn {
		padding: 0.75rem 1.5rem;
		font-size: 1.2rem;
		font-weight: bold;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
	}

	.counter-btn--increment {
		background: #27ae60;
		color: white;
	}

	.counter-btn--increment:hover {
		background: #229954;
		transform: translateY(-2px);
	}

	.counter-btn--decrement {
		background: #e74c3c;
		color: white;
	}

	.counter-btn--decrement:hover {
		background: #cb4335;
		transform: translateY(-2px);
	}

	.counter-btn--reset {
		background: #f39c12;
		color: white;
	}

	.counter-btn--reset:hover {
		background: #e67e22;
		transform: translateY(-2px);
	}

	.counter-input-section {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	input[type="number"] {
		padding: 0.5rem;
		border: 2px solid #bdc3c7;
		border-radius: 6px;
		font-size: 1rem;
		text-align: center;
		width: 120px;
		transition: border-color 0.2s ease;
	}

	input[type="number"]:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
	}

	h2 {
		margin: 0;
		color: #34495e;
		font-size: 1.5rem;
	}

	@media (prefers-color-scheme: dark) {
		.counter-container {
			background: linear-gradient(135deg, #2c3e50, #34495e);
			border-color: #5d6d7e;
		}

		h2 {
			color: #ecf0f1;
		}

		.counter-display {
			background: #34495e;
			color: #ecf0f1;
			border-color: #5dade2;
		}

		input[type="number"] {
			background: #34495e;
			color: #ecf0f1;
			border-color: #5d6d7e;
		}

		input[type="number"]:focus {
			border-color: #5dade2;
		}
	}
</style>
