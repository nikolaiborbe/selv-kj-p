<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher<{ scan: string }>();
	let { new_item = $bindable(), items_in_bascet_gtin = $bindable() } = $props();

	let videoEl!: HTMLVideoElement;
	let scanning = $state(false);
	let last = $state('');
	let err = $state('');

	let raf = 0;
	let zxingControls: any = null;

	async function start() {
		err = '';
		last = '';
		scanning = true;

		const stream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: 'environment' },
			audio: false
		});
		videoEl.srcObject = stream;
		await videoEl.play();

		if ('BarcodeDetector' in window) runNative();
		else runZXing();
	}

	function stop() {
		cancelAnimationFrame(raf);
		raf = 0;

		const s = videoEl?.srcObject as MediaStream | null;
		s?.getTracks().forEach((t) => t.stop());
		if (videoEl) videoEl.srcObject = null;

		zxingControls?.stop?.();
		zxingControls = null;

		scanning = false;
	}

	function emit(code: string) {
		if (code && code !== last) {
			last = code;
			items_in_bascet_gtin = [...items_in_bascet_gtin, code];
			new_item = true;
			dispatch('scan', code);
			navigator.vibrate?.(40);
			stop();
		}
	}

	async function runNative() {
		// @ts-ignore
		const detector = new window.BarcodeDetector({
			formats: ['ean_13', 'ean_8', 'upc_a', 'code_128', 'code_39']
		});

		const loop = async () => {
			if (!scanning) return;
			try {
				const res = await detector.detect(videoEl);
				const code = res?.[0]?.rawValue as string | undefined;
				if (code) return emit(code);
			} catch (e) {
				err = String(e ?? '');
			}
			raf = requestAnimationFrame(loop);
		};
		loop();
	}

	async function runZXing() {
		const [{ BrowserMultiFormatReader }, { NotFoundException }] = await Promise.all([
			import('@zxing/browser'),
			import('@zxing/library')
		]);

		const reader = new BrowserMultiFormatReader();
		zxingControls = await reader.decodeFromVideoDevice(undefined, videoEl, (result, error) => {
			if (result) emit(result.getText());
			else if (error && !(error instanceof NotFoundException)) err = String(error);
		});
	}

	onMount(start);
	onDestroy(stop);
</script>

<div class="flex flex-col items-center justify-content gap-3">
	<video bind:this={videoEl} autoplay playsinline muted class="w-full bg-black aspect-video"
	></video>
	<div class="flex items-center gap-2">
		<button
			class="bg-neutral-800 rounded-md w-28 h-10 cursor-pointer"
			onclick={start}
			disabled={scanning}
		>
			{scanning ? 'Scanning…' : 'Start'}
		</button>
		<button
			class="bg-neutral-800 rounded-md w-28 h-10 cursor-pointer"
			onclick={stop}
			disabled={!scanning}
		>
			Stop
		</button>
	</div>
	{#if err}<p class="text-red-600 text-sm">{err}</p>{/if}
</div>
