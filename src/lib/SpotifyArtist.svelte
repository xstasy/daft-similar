<script lang="ts">
	import { cubicOut } from 'svelte/easing';

	export let artistName: string;
	export let artistId: string;
	export let embedHtml: string;
	export let thumbnailUrl: string;
	export let forceLoad: boolean = false; // Controlled by parent

	let loaded = false;

	// Automatically load if parent sets forceLoad
	$: if (forceLoad) loaded = true;

	function loadEmbed() {
		loaded = true;
	}

	function popIn(node: HTMLElement) {
		return {
			duration: 350,
			easing: cubicOut,
			css: (t: any) => `
        opacity: ${t};
        transform: translateY(${(1 - t) * 10}px);
      `
		};
	}
</script>

<div
	class="max-152 relative h-full w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg"
>
	<a
		href={`spotify:artist:${artistId}`}
		class="absolute top-3 left-3 z-20 rounded-lg bg-black/40 px-3 py-1 font-bold text-white transition hover:bg-black/60"
		on:click|stopPropagation
	>
		{artistName}
	</a>

	{#if !loaded}
		<div class="group relative h-full w-full cursor-pointer" on:click={loadEmbed}>
			<img
				src={thumbnailUrl}
				alt={artistName}
				class="h-full w-full scale-110 object-cover opacity-60"
			/>
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="text-xl font-bold text-white drop-shadow-lg">Click to load</span>
			</div>
			<div class="absolute inset-0 bg-black/10 transition group-hover:bg-black/20"></div>
		</div>
	{:else}
		<div class="embed-wrapper h-full w-full" transition:popIn>
			{@html embedHtml}
		</div>
	{/if}
</div>

<style>
	.max-152 {
		max-height: 154px;
	}

	.embed-wrapper {
		pointer-events: none;
		width: 100%;
		height: 100%;
	}

	.embed-wrapper :global(iframe) {
		pointer-events: auto;
		width: 100%;
		height: 100%;
	}
</style>
