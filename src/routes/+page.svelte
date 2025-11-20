<script lang='ts'>
    import data from '$lib/eras.json';
	import EraScroller from "$lib/EraScroller.svelte";
    const eras: any = data;
</script>

<EraScroller eras={eras}></EraScroller>
