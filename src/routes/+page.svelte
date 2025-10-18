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
	let new_item = $state(false);
	let cart: Product[] = $state([]);

	function update_products_in_bascet_display() {
		const temp: string[] = [];
		const temp_cart: Product[] = [];

		for (let i = 0; i < items_in_bascet_gtin.length; i++) {
			const gtin = items_in_bascet_gtin[i];
			if (!gtin) continue;

			const item =
				products.find((p) => p.gtin === gtin) ?? custom_products.find((p) => p.gtin === gtin);
			if (item) {
				temp_cart.push(item);
			}

			const name =
				products.find((p) => p.gtin === gtin)?.name ??
				custom_products.find((p) => p.gtin === gtin)?.name;

			if (name) temp.push(name);
		}
		display_products = temp;
		cart = temp_cart;
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

			setInterval(() => {
				if (new_item) {
					update_products_in_bascet_display();
					new_item = false;
				}
			}, 100);
		})();
	});
</script>

{#if main_page}
	<MainPage bind:main_page />
{:else}
	<div class="w-screen h-screen bg-black p-4 text-sm text-white items-center">
		{#if !checkout}
			<div class="flex flex-col gap-2 items-center cursor-pointer">
				<Scanner bind:new_item bind:items_in_bascet_gtin on:scan={(e) => (code = e.detail)} />
			</div>

			<div class="pt-10 rounded-md pb-4">
				{#if items_in_bascet_gtin.length > 1}
					<p class="font-semibold">Cart</p>
					<div class="bg-natural-800 rounded-xl">
						<ul class="list-disc">
							{#each display_products as name}
								<li class="">
									{name}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			{#if items_in_bascet_gtin.length > 0}
				<button
					class="w-40 h-12 rounded-lg bg-neutral-800 outline-1 outline-gray-600/50"
					onclick={() => (checkout = true)}
				>
					Checkout
				</button>
			{/if}
		{:else if checkout}
			<Checkout {cart} />
		{/if}
	</div>
	<div class="fixed inset-x-0 bottom-0 bg-zinc-800 h-20 w-full flex justify-between px-8">
		<Home bind:main_page />
		<Money bind:main_page />
		<Paper />
		<Person />
	</div>
{/if}
