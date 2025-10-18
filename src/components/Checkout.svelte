<script lang="ts">
	import { onMount } from 'svelte';
	import type { Product } from '../routes/types.ts';

	let total_weight = $state(0);
	let { cart }: { cart: Product[] } = $props();

	let weighing = $state(false);

	let can_pay = $state(false);

	let test_weight = 10;
	let weigh_does_not_match = $state(false);
	let checkout_measured_weight = $state(Infinity);

	function get_item_weight(name: string): number {
		let j = name.split(' ');
		let unit = j[j.length - 1];
		let weight = j[j.length - 2] as unknown as number;

		if (unit === 'g') {
			return weight;
		} else if (unit === 'l') return weight * 1000;
		else return 0;
	}

	function handle_checkout_click() {
		weighing = true;
		// TODO
		if (Math.abs(checkout_measured_weight - total_weight) < 50 * cart.length) {
			can_pay = true;
		} else {
			weigh_does_not_match = true;
		}
	}
	function try_to_pay() {
		handle_checkout_click();
	}

	onMount(() => {
		for (let i = 0; i < cart.length; i++) {
			total_weight += get_item_weight(cart[i].name);
		}
	});
</script>

<div class="w-full h-screen flex justify-center items-center">
	<div class="">
		{#if !weighing}
			<div class="flex flex-col items-center gap-5">
				<p>Please place the bag on the weght</p>
				<p>{total_weight}</p>
				<button
					class="bg-slate-500 rounded-md w-20 h-10 cursor-pointer"
					onclick={() => (weighing = true)}
				>
					Done
				</button>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-5">
				<p>Please insert current weight (in grams)</p>
				<input
					type="number"
					name="Please insert the weight"
					class="h-10 rounded-md border w-full"
					bind:value={checkout_measured_weight}
				/>
				<button
					class="bg-slate-500 rounded-md w-20 h-10 cursor-pointer"
					onclick={() => try_to_pay()}
				>
					Pay
				</button>
				{#if can_pay}
					Success
				{:else if weigh_does_not_match}
					The scanned items does not match the weight.
				{/if}
			</div>
		{/if}
	</div>
</div>
