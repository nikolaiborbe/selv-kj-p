<script lang="ts">
	import Arrow from '../icons/Arrow.svelte';
	import Home from '../icons/Home.svelte';
	import Money from '../icons/Money.svelte';
	import Paper from '../icons/Paper.svelte';
	import Person from '../icons/Person.svelte';

	let { main_page = $bindable(), ...props } = $props();
</script>

<div class="w-screen h-screen bg-black p-4 text-sm">
	<div class="h-14"></div>
	<div class="">
		<div class=" bg-white h-36 w-full flex justify-center self-center rounded-2xl p-2 px-4">
			<img src="./strekkode.jpg" alt="egen strekkode" />
		</div>
	</div>

	<div class="text-white flex flex-col gap-1 mt-10">
		<p class="font-semibold pb-1">Bonuskonto</p>
		<div
			class="rounded-lg bg-gray-600/30 outline-1 outline-gray-600/50 h-18 flex justify-between items-center"
		>
			<div class="flex items-center">
				<img src="./coin.png" alt="coin" class="w-14 p-2" />
				<div class="">
					<p class="font-bold">0 kr på din bonuskonto</p>
					<p>Bruk bonusen din</p>
				</div>
			</div>
			<div class="pr-2">
				<Arrow />
			</div>
		</div>

		<div class="text-white flex flex-col gap-1 mt-10">
			<p class="font-semibold pb-1">REMA 1000 er mestvinnende i pristester 🏆</p>

			<div
				class="rounded-2xl bg-gray-600/30 outline-1 outline-gray-600/50 flex flex-col justify-between items-between h-64"
			>
				<img src="./rema1000.jpg" alt="rema" class="w-full rounded-t-2xl" />
				<div class="h-full flex flex-col justify-center pl-4 gap-1">
					<p class="font-semibold">Det er sluttsummen på kassalappen som teller!</p>
					<p class="text-xs">Les mer her</p>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="fixed inset-x-0 bottom-0 bg-zinc-800 h-20 w-full flex justify-between px-8">
	<Home />
	<Money bind:main_page />
	<Paper />
	<Person />
</div>
