<script lang="ts">
	import { onMount } from 'svelte';

	let videoEl: HTMLVideoElement;
	let stream: MediaStream | null = null;

	async function start() {
		stop(); // clean previous
		try {
			const constraints: MediaStreamConstraints = {
				video: { facingMode: { ideal: 'environment' } },
				audio: false
			};
			stream = await navigator.mediaDevices.getUserMedia(constraints);
			videoEl.srcObject = stream;
			await videoEl.play(); // iOS needs this
		} catch (e: any) {
			console.error(e.name, e.message);
			alert(msgFromError(e));
		}
	}

	function stop() {
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
	}

	function msgFromError(e: any) {
		if (e.name === 'NotAllowedError') return 'Permission denied. Check site settings.';
		if (e.name === 'NotFoundError') return 'No camera found or in-use.';
		if (e.name === 'NotReadableError') return 'Camera busy in another app.';
		return 'Camera error. See console.';
	}

	onMount(() => () => stop());
</script>

<div class="flex justify-center gap-2 pt-4">
	<button on:click={start} class="bg-blue-400 w-20 h-14 rounded-md">Open camera</button>
	<button on:click={stop} class="bg-blue-400 w-20 h-14 rounded-md">Stop</button>
</div>
<video bind:this={videoEl} playsinline autoplay muted style="width:100%;"></video>
