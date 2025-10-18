<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	let { children } = $props();

	onMount(() => {
		const onWheel = (e: WheelEvent) => {
			if (e.ctrlKey) e.preventDefault();
		}; // Ctrl+scroll
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && ['=', '-', '+', '0'].includes(e.key)) e.preventDefault(); // Ctrl/⌘ + +/-/0
		};
		const stopGesture = (e: Event) => e.preventDefault(); // iOS pinch

		window.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('keydown', onKey, { passive: false });
		window.addEventListener('gesturestart', stopGesture);
		window.addEventListener('gesturechange', stopGesture);

		return () => {
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('gesturestart', stopGesture);
			window.removeEventListener('gesturechange', stopGesture);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
	/>
</svelte:head>

{@render children?.()}
