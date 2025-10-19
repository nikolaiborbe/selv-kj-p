<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import Image from '../icons/Image.svelte';

	const dispatch = createEventDispatcher<{ scan: string }>();
	let { new_item = $bindable(), items_in_bascet_gtin = $bindable() } = $props();

	let videoEl!: HTMLVideoElement;
	let scanning = $state(false);
	let last = $state('');
	let err = $state('');
	const SCAN_MS = 150;

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
	// replace your runNative with a throttled version (scan 0° then 90° only)
	async function runNative() {
		// @ts-ignore
		const detector = new window.BarcodeDetector({
			formats: ['ean_13', 'ean_8', 'upc_a', 'code_128', 'code_39']
		});
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;

		const tryDetect = async (src: CanvasImageSource) => {
			const res = await detector.detect(src as any);
			return res?.[0]?.rawValue as string | undefined;
		};

		const loop = async () => {
			if (!scanning) return;
			try {
				let code = await tryDetect(videoEl);
				if (!code) {
					canvas.width = videoEl.videoHeight;
					canvas.height = videoEl.videoWidth;

					ctx.save();
					ctx.translate(canvas.width, 0); // move origin so rotated image fits
					ctx.rotate(Math.PI / 2);
					ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
					ctx.restore();

					code = await tryDetect(canvas);
				}
				if (code) return emit(code);
			} catch (e) {
				err = String(e ?? '');
			}
			setTimeout(loop, SCAN_MS); // throttle
		};
		loop();
	}

	async function runZXing() {
		const [{ BrowserMultiFormatReader }, lib] = await Promise.all([
			import('@zxing/browser'),
			import('@zxing/library')
		]);
		const { NotFoundException, DecodeHintType, BarcodeFormat } = lib;

		const hints = new Map();
		// hints.set(DecodeHintType.TRY_HARDER, true);
		hints.set(DecodeHintType.POSSIBLE_FORMATS, [
			BarcodeFormat.EAN_13,
			BarcodeFormat.EAN_8,
			BarcodeFormat.UPC_A,
			BarcodeFormat.CODE_128,
			BarcodeFormat.CODE_39
		]);

		const reader = new BrowserMultiFormatReader(hints);
		zxingControls = await reader.decodeFromVideoDevice(undefined, videoEl, (result, error) => {
			if (result) emit(result.getText());
			else if (error && !(error instanceof NotFoundException)) err = String(error);
		});
	}

	onMount(start);
	onDestroy(stop);
</script>

<div class="flex flex-col items-center justify-content gap-5">
	<div class="mt-14">
		{#if scanning}
			<video bind:this={videoEl} autoplay playsinline muted class=" aspect-video"></video>
		{/if}
	</div>
	<div class="flex items-center gap-2">
		{#if !scanning}
			<button
				class="bg-zinc-600 w-72 rounded-full h-12 cursor-pointer text-teal-500 font-semibold"
				onclick={start}
				disabled={scanning}
			>
				Skann ny vare
			</button>
		{:else if scanning}
			<button
				class="bg-zinc-600 w-72 rounded-full h-12 cursor-pointer text-teal-500 font-semibold"
				onclick={stop}
				disabled={!scanning}
			>
				Stopp skanning
			</button>
		{/if}
	</div>
	{#if err}<p class="text-red-600 text-sm">{err}</p>{/if}
</div>
