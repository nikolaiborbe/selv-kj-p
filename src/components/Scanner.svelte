<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import Image from '../icons/Image.svelte';

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

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;

		const tryDetect = async (source: CanvasImageSource) => {
			const res = await detector.detect(source as any);
			return res?.[0]?.rawValue as string | undefined;
		};

		const loop = async () => {
			if (!scanning) return;
			try {
				// 0°
				let code = await tryDetect(videoEl);
				if (!code) {
					// 90°, 180°, 270°
					const angles = [90, 180, 270];
					for (const deg of angles) {
						if (deg % 180 === 0) {
							canvas.width = videoEl.videoWidth;
							canvas.height = videoEl.videoHeight;
						} else {
							canvas.width = videoEl.videoHeight;
							canvas.height = videoEl.videoWidth;
						}
						ctx.save();
						ctx.translate(canvas.width / 2, canvas.height / 2);
						ctx.rotate((deg * Math.PI) / 180);
						ctx.drawImage(videoEl, -videoEl.videoWidth / 2, -videoEl.videoHeight / 2);
						ctx.restore();
						code = await tryDetect(canvas);
						if (code) break;
					}
				}
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
