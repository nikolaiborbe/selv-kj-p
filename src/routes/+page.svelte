<script lang="ts">
	import { onMount } from 'svelte';
	import type { Product } from './types';

	import Arrow from '../icons/Arrow.svelte';
	import Home from '../icons/Home.svelte';
	import Money from '../icons/Money.svelte';
	import Paper from '../icons/Paper.svelte';
	import Person from '../icons/Person.svelte';
	import Scanner from '../components/Scanner.svelte';
	import Checkout from '../components/Checkout.svelte';
	import MainPage from '../components/MainPage.svelte';
	let code = $state('');

	let items_in_bascet_gtin: string[] = $state([]);
	let products: Product[] = $state([]);
	let display_products: string[] = $state([]);
	let custom_products: Product[] = $state([]);
	let total_weigh = $state(0);
	let checkout = $state(false);
	let main_page = $state(true);

	function update_products_in_bascet_display() {
		let temp = [];
		for (let i = 0; i <= items_in_bascet_gtin.length; i++) {
			let gtin = items_in_bascet_gtin[i];

			let name = products.find((p) => p.gtin === gtin)?.name;

			if (name == undefined) {
				console.log("didn't find product, look in custom product list");
				let name = custom_products.find((p) => p.gtin === gtin)?.name;
				if (name) temp.push(name);
			}
		}
		display_products = [...temp];
	}

	async function get_products() {
		const resp = await fetch('/products');
		const data = await resp.json();
		products = data;
	}

	onMount(() => {
		(async () => {
			await get_products();
			const res = await fetch('/custom_products.json');
			custom_products = await res.json();
			items_in_bascet_gtin.push('5060337502238');
			items_in_bascet_gtin.push('5060337502238');
			items_in_bascet_gtin.push('5060337502238');

			setInterval(() => {
				update_products_in_bascet_display();
			}, 300);
		})();
	});
</script>

{#if main_page}
	<MainPage bind:main_page />
{:else}
	<div class="w-screen h-screen bg-black p-4 text-sm text-white flex flex-col items-center">
		{#if !checkout}
			<div class="flex flex-col gap-2 items-center cursor-pointer">
				<Scanner bind:items_in_bascet_gtin on:scan={(e) => (code = e.detail)} />
			</div>

			<div class="pt-10 rounded-md pb-4">
				{#if products}
					{#each display_products as name}
						<p class="">
							{name}
						</p>
					{/each}
				{/if}
			</div>

			{#if items_in_bascet_gtin.length > 0}
				<button
					class="w-40 h-12 rounded-lg bg-zinc-800 outline-1 outline-gray-600/50"
					onclick={() => (checkout = true)}
				>
					Checkout
				</button>
			{/if}
		{:else if checkout}
			<Checkout {custom_products} />
		{/if}
	</div>
	<div class="fixed inset-x-0 bottom-0 bg-zinc-800 h-20 w-full flex justify-between px-8">
		<Home />
		<Money bind:main_page />
		<Paper />
		<Person />
	</div>
{/if}
