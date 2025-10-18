<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import { BrowserMultiFormatReader } from '@zxing/browser';
	import { NotFoundException } from '@zxing/library';
	import { BarcodeFormat, DecodeHintType } from '@zxing/library';

	const dispatch = createEventDispatcher<{ scan: string }>();

	let { items_in_bascet_gtin = $bindable(), ...props } = $props();

	let videoEl!: HTMLVideoElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let scanning = $state(false);
	let last = $state('');
	let err = $state('');

	let anim: number | null = null;

	// ZXing fallback
	let zxingControls: import('@zxing/browser').IScannerControls | null = null;

	const formats = ['ean_13', 'ean_8', 'upc_a', 'code_128', 'code_39'] as const;

	async function start() {
		err = '';
		last = '';
		scanning = true;

		// camera
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: 'environment' },
			audio: false
		});
		videoEl.srcObject = stream;
		await videoEl.play();

		// canvas
		canvas.width = videoEl.videoWidth || 640;
		canvas.height = videoEl.videoHeight || 480;
		ctx = canvas.getContext('2d')!;

		// prefer BarcodeDetector
		if ('BarcodeDetector' in window) runDetector();
		else runZXing();
	}

	function stop() {
		anim && cancelAnimationFrame(anim);
		anim = null;

		const s = (videoEl?.srcObject as MediaStream | null) ?? null;
		s?.getTracks().forEach((t) => t.stop());
		if (videoEl) videoEl.srcObject = null;

		zxingControls?.stop();
		zxingControls = null;

		scanning = false;
	}

	async function runDetector() {
		// @ts-expect-error web-idl
		const supported = await window.BarcodeDetector.getSupportedFormats?.();
		// @ts-expect-error web-idl
		const det = new window.BarcodeDetector({
			formats: (supported?.length ? supported : []).filter((f: string) =>
				formats.includes(f as any)
			)
		});

		const tries: Array<(w: number, h: number) => void> = [
			// identity
			(w, h) => {
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				ctx.drawImage(videoEl, 0, 0, w, h);
			},
			// horizontal flip
			(w, h) => {
				ctx.setTransform(-1, 0, 0, 1, w, 0);
				ctx.drawImage(videoEl, 0, 0, w, h);
			},
			// vertical flip
			(w, h) => {
				ctx.setTransform(1, 0, 0, -1, 0, h);
				ctx.drawImage(videoEl, 0, 0, w, h);
			},
			// rotate 90
			(w, h) => {
				ctx.setTransform(0, 1, -1, 0, h, 0);
				ctx.drawImage(videoEl, 0, 0, w, h);
			},
			// rotate 270
			(w, h) => {
				ctx.setTransform(0, -1, 1, 0, 0, w);
				ctx.drawImage(videoEl, 0, 0, w, h);
			}
		];

		const loop = async () => {
			const w = canvas.width,
				h = canvas.height;
			for (const draw of tries) {
				ctx.clearRect(0, 0, w, h);
				draw(w, h);
				try {
					const res = await det.detect(canvas);
					if (res && res[0]?.rawValue) {
						const text = res[0].rawValue as string;
						last = text;
						items_in_bascet_gtin = [...items_in_bascet_gtin, text];
						dispatch('scan', text);
						navigator.vibrate?.(40);
						stop();
						return;
					}
				} catch (e) {
					err = String(e);
				}
			}
			anim = requestAnimationFrame(loop);
		};
		loop();
	}

	async function runZXing() {
		const hints = new Map();
		hints.set(DecodeHintType.POSSIBLE_FORMATS, [
			BarcodeFormat.EAN_13,
			BarcodeFormat.EAN_8,
			BarcodeFormat.UPC_A,
			BarcodeFormat.CODE_128,
			BarcodeFormat.CODE_39
		]);
		hints.set(DecodeHintType.TRY_HARDER, true);

		const reader = new BrowserMultiFormatReader(hints);

		// ZXing scans the raw stream; we also try flipped views by redrawing to canvas and feeding images
		// Fallback continuous stream:
		zxingControls = await reader.decodeFromVideoDevice(undefined, videoEl, (result, error) => {
			if (result) {
				const text = result.getText();
				last = text;
				items_in_bascet_gtin = [...items_in_bascet_gtin, text];
				dispatch('scan', text);
				navigator.vibrate?.(40);
				stop();
			} else if (error && !(error instanceof NotFoundException)) {
				err = String(error);
			}
		});

		// Auxiliary flip attempts in parallel using snapshots
		const tries: Array<(w: number, h: number) => void> = [
			(w, h) => {
				ctx.setTransform(-1, 0, 0, 1, w, 0);
				ctx.drawImage(videoEl, 0, 0, w, h);
			},
			(w, h) => {
				ctx.setTransform(1, 0, 0, -1, 0, h);
				ctx.drawImage(videoEl, 0, 0, w, h);
			},
			(w, h) => {
				ctx.setTransform(0, 1, -1, 0, h, 0);
				ctx.drawImage(videoEl, 0, 0, w, h);
			},
			(w, h) => {
				ctx.setTransform(0, -1, 1, 0, 0, w);
				ctx.drawImage(videoEl, 0, 0, w, h);
			}
		];

		const probe = async () => {
			if (!scanning) return;
			const w = canvas.width,
				h = canvas.height;
			for (const draw of tries) {
				ctx.clearRect(0, 0, w, h);
				draw(w, h);
				try {
					// slow but effective snapshot try
					const dataUrl = canvas.toDataURL('image/png');
					const img = new Image();
					await new Promise<void>((ok) => ((img.onload = () => ok()), (img.src = dataUrl)));
					const res = await reader.decodeFromImageElement(img as HTMLImageElement);
					if (res) {
						const text = res.getText();
						last = text;
						dispatch('scan', text);
						navigator.vibrate?.(40);
						stop();
						return;
					}
				} catch {
					/* ignore */
				}
			}
			anim = requestAnimationFrame(probe);
		};
		probe();
	}

	onMount(() => {
		let cancelled = false;

		(async () => {
			await tick(); // wait for bind:this
			if (cancelled || !videoEl) return;
			await start();
		})();

		return () => {
			cancelled = true;
			stop();
		};
	});

	onDestroy(stop);
</script>

<div class="flex flex-col gap-3 flex flex-col items-center">
	<video
		bind:this={videoEl}
		autoplay
		playsinline
		muted
		class="w-full rounded-lg bg-black aspect-video"
	/>
	<canvas bind:this={canvas} class="hidden"></canvas>

	<div class="flex items-center gap-2">
		<button
			class="w-40 h-12 rounded-lg bg-zinc-800 outline-1 outline-gray-600/50"
			on:click={start}
			disabled={scanning}>{scanning ? 'Scanning…' : 'Start'}</button
		>
		<button
			class="w-40 h-12 rounded-lg bg-zinc-800 outline-1 outline-gray-600/50"
			on:click={stop}
			disabled={!scanning}>Stop</button
		>
	</div>

	<!-- {#if last}<p>Scanned: <strong>{last}</strong></p>{/if} -->
	{#if err}<p class="text-red-600">{err}</p>{/if}
</div>
