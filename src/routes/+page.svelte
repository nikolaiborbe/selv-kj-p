<script lang="ts">
	import Camera from '../components/Camera.svelte';
	import { onDestroy } from 'svelte';
	import { BrowserMultiFormatOneDReader, type IScannerControls } from '@zxing/browser';
	import { NotFoundException } from '@zxing/library';

	let videoEl: HTMLVideoElement;
	let controls: IScannerControls | null = null;

	let abort = $state(false);

	async function get_video() {
		abort = false;
		controls?.stop();
		controls = null;

		// pick a camera (undefined => default)
		const devices = await BrowserMultiFormatOneDReader.listVideoInputDevices();
		const deviceId = devices[0]?.deviceId;

		const reader = new BrowserMultiFormatOneDReader();

		controls = await reader.decodeFromVideoDevice(deviceId, videoEl, (result, err) => {
			if (result) {
				console.log('QR:', result.getText());
			}
			if (err && !(err instanceof NotFoundException)) console.warn(err);
		});

		setInterval(() => {
			if (abort) controls?.stop();
		}, 500);
	}

	onDestroy(() => {
		controls?.stop();
	});
</script>

<!-- <Camera /> -->
<div class="w-full h-screen flex flex-col items-center justify-center gap-4">
	<video
		bind:this={videoEl}
		autoplay
		playsinline
		muted
		class="w-[320px] h-auto rounded-md border"
	/>
	<div>
		<button onclick={get_video} class="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer">
			Start scanner
		</button>
		<button
			onclick={() => {
				abort = true;
			}}
			class="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer">Cancel</button
		>
	</div>
</div>
