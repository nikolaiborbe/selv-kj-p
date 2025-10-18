<script lang="ts">
	import type { Product } from '../routes/types.ts';

	let total_weigh = $state(Infinity);
	let { custom_products }: { custom_products: Product[] } = $props();

	let weighing = $state(false);

	let can_pay = $state(false);

	let test_weight = 10;
	let weigh_does_not_match = $state(false);
	let checkout_measured_weight = $state(Infinity);

	function get_total_product_weight(): number {
		let tot = 0;
		for (let i = 0; i < custom_products.length; i++) {
			let name = custom_products[i].name;
			let j = name.split(' ');
			let unit = j[j.length - 1];
			let weight = j[j.length - 2] as unknown as number;

			if (unit === 'g') {
				tot += weight;
			} else if (unit === 'l') tot += weight * 1000;
		}
		console.log(tot);
		return tot;
	}

	function handle_checkout_click() {
		weighing = true;
		// TODO
		if (
			Math.abs(checkout_measured_weight - get_total_product_weight()) <
			50 * custom_products.length
		) {
			can_pay = true;
		} else {
			weigh_does_not_match = true;
		}
	}
	function try_to_pay() {
		handle_checkout_click();
	}
</script>

<div class="w-full h-screen flex justify-center items-center">
	<div class="">
		{#if !weighing}
			<div class="flex flex-col items-center gap-5">
				<p>Please place the bag on the weght</p>
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
