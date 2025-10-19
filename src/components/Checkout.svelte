<script lang="ts">
	import { onMount } from 'svelte';
	import type { Product } from '../routes/types.ts';
	import { refreshAll } from '$app/navigation';
	import MoneyIcon from '../icons/MoneyIcon.svelte';

	let total_weight: number = $state(0);
	let { cart }: { cart: Product[] } = $props();

	let weighing = $state(false);

	let can_pay = $state(false);
	let tried_to_pay = $state(false);

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

	function handle_checkout_click_95_conf() {
		weighing = true;
		let n = Number(cart.length);
		let lower_bound = checkout_measured_weight - 1.96 * Math.sqrt(50 / n);
		let upper_bound = checkout_measured_weight + 1.96 * Math.sqrt(50 / n);
		if (total_weight < upper_bound && total_weight > lower_bound) {
			can_pay = true;
			setTimeout(() => {
				if (typeof window !== 'undefined') location.reload();
			}, 1500);
		} else {
			weigh_does_not_match = true;
		}
	}

	function handle_checkout_click() {
		weighing = true;
		// TODO
		if (Math.abs(checkout_measured_weight - total_weight) < 50 * cart.length) {
			can_pay = true;
			setTimeout(() => {
				if (typeof window !== 'undefined') location.reload();
			}, 1500);
		} else {
			weigh_does_not_match = true;
		}
	}
	function try_to_pay() {
		tried_to_pay = true;
		handle_checkout_click_95_conf();
	}

	onMount(() => {
		for (let i = 0; i < cart.length; i++) {
			total_weight += Number(get_item_weight(cart[i].name));
		}
	});
</script>

<div class="w-full h-screen flex justify-center items-center font-semibold">
	<div class="">
		{#if !weighing}
			<div class="flex flex-col items-center gap-5 pb-4">
				<p>Plaser handleposen på vekta.</p>
				<button
					class="bg-zinc-700 w-72 rounded-full h-12 cursor-pointer text-cyan-300 font-semibold"
					onclick={() => (weighing = true)}
				>
					Gå videre
				</button>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-5">
				<p>Skriv inn målt vekt (i gram)</p>
				<p class="font-normal">(bare for demo)</p>
				<input
					type="number"
					name="Please insert the weight"
					class="border w-40 h-12 bg-zinc-700 rounded-xl pl-2"
					bind:value={checkout_measured_weight}
				/>
				{#if !tried_to_pay}
					<button
						class="flex w-72 h-14 rounded-full bg-blue-700 font-semibold justify-around items-center px-4 mt-10"
						onclick={() => try_to_pay()}
					>
						<div class="flex gap-2 items-center">
							<MoneyIcon />
							Betal
						</div>
					</button>
				{:else if can_pay && tried_to_pay}
					<div class="font-semibold">Betalt!</div>
				{/if}
				{#if !can_pay && tried_to_pay}
					<p class="font-semibold">
						Varene sammsvarer ikke med målt vekt. Tilkaller betjent. Vennligst vent.
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
