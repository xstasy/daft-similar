<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly } from 'svelte/transition';
  import SpotifyArtist from './SpotifyArtist.svelte';

  export let eras: {
    title: string;
    coverUrl: string;
    artists: { name: string; artistId: string; embedHtml: string; thumbnailUrl: string }[];
  }[];

  function slugify(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const slugs = eras.map(e => slugify(e.title));

  const visibleEras = writable<Set<string>>(new Set());
  const activeEra = writable<string | null>(null);

  const artistHeight = 152 + 24;

  let sidebar: HTMLDivElement;
  let mainScroll: HTMLDivElement;

  let ignoreInitialActiveEra = true;
  let hashLoadedEra: string | null = null;

  // Hover auto-open toggle
  let autoOpenHrefOnHover = false;

  onMount(() => {
    const saved = localStorage.getItem('autoOpenHrefOnHover');
    if (saved === 'true') autoOpenHrefOnHover = true;
  });

  function toggleAutoOpen() {
    autoOpenHrefOnHover = !autoOpenHrefOnHover;
    localStorage.setItem('autoOpenHrefOnHover', autoOpenHrefOnHover ? 'true' : 'false');
  }

  // Force load map for staggered iframe loading
  let forceLoadMap: Record<string, boolean[]> = {};
  eras.forEach((era, i) => {
    forceLoadMap[slugs[i]] = era.artists.map(() => false);
  });

  function goto(slug: string) {
    const target = document.getElementById(`era-${slug}`);
    if (!target || !mainScroll) return;

    mainScroll.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    activeEra.set(slug);

    const item = sidebar?.querySelector(`[data-sidebar-slug="${slug}"]`);
    item?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    visibleEras.update(s => s.add(slug));

    forceLoadMap[slug].forEach((_, idx) => {
      setTimeout(() => {
        forceLoadMap = {
          ...forceLoadMap,
          [slug]: forceLoadMap[slug].map((v, i) => (i === idx ? true : v))
        };
      }, idx * 300);
    });

    if (window.location.hash !== `#era-${slug}`) {
      history.replaceState(null, '', `#era-${slug}`);
    }
  }

  // Lock sidebar scroll to active era
  activeEra.subscribe(slug => {
    if (!slug || !sidebar) return;

    const item = sidebar.querySelector(`[data-sidebar-slug="${slug}"]`);
    if (item) {
      const sidebarMid = sidebar.clientHeight / 2;
      const itemTop = item.offsetTop;
      const itemHeight = item.clientHeight;

      sidebar.scrollTo({
        top: itemTop - sidebarMid + itemHeight / 2,
        behavior: 'smooth'
      });
    }
  });

  // Track main scroll to update active era
  function handleMainScroll() {
    const mainTop = mainScroll.scrollTop;

    for (let i = 0; i < slugs.length; i++) {
      const el = document.getElementById(`era-${slugs[i]}`);
      if (!el) continue;
      const offsetTop = el.offsetTop;
      const offsetHeight = el.offsetHeight;

      if (mainTop >= offsetTop - 20 && mainTop < offsetTop + offsetHeight - 20) {
        activeEra.set(slugs[i]);
        break;
      }
    }
  }

  onMount(async () => {
    await tick();

    const hash = window.location.hash;
    setTimeout(() => {
      if (hash.startsWith('#era-')) {
        const slug = hash.slice('#era-'.length);
        const target = document.getElementById(`era-${slug}`);
        if (!target || !mainScroll) return;

        target.scrollIntoView({ behavior: 'smooth' });
        activeEra.set(slug);
        hashLoadedEra = slug;
        visibleEras.update(s => s.add(slug));

        const item = sidebar?.querySelector(`[data-sidebar-slug="${slug}"]`);
        item?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        forceLoadMap[slug].forEach((_, idx) => {
          setTimeout(() => {
            forceLoadMap = {
              ...forceLoadMap,
              [slug]: forceLoadMap[slug].map((v, i) => (i === idx ? true : v))
            };
          }, idx * 300);
        });
      }
    }, 25);

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const slug = entry.target.getAttribute('data-slug');
        if (!slug) return;
        if (entry.isIntersecting && slug !== hashLoadedEra) {
          visibleEras.update(s => s.add(slug));
        }
      });
    }, { threshold: 0.25 });

    slugs.forEach(slug => {
      const el = document.getElementById(`era-${slug}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  });
</script>

<div class="flex h-screen overflow-hidden">
  <!-- Sidebar -->
  <div bind:this={sidebar} class="scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800 hidden w-72 flex-col items-center space-y-4 overflow-y-auto bg-gray-900 pb-4 md:flex">

    <!-- Toggle button -->
    <div
      class="w-full flex items-center justify-start cursor-pointer select-none px-4 py-2 mb-2 bg-gray-800 hover:bg-gray-700 shadow text-white text-sm transition"
      title="When enabled, hovering an artist will automatically open their Spotify link"
      on:click={toggleAutoOpen}
    >
      <div class={`w-8 h-8 mr-3 rounded-full border border-white flex-shrink-0 flex items-center justify-center ${autoOpenHrefOnHover ? 'bg-green-500' : 'bg-gray-900'}`}>
        {#if autoOpenHrefOnHover}
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        {/if}
      </div>
      <span class="text-lg">{autoOpenHrefOnHover ? 'Auto-open artist ON' : 'Auto-open artist OFF'}</span>
    </div>

    {#each eras as era, i}
      <div
        data-sidebar-slug={slugs[i]}
        class="relative flex cursor-pointer flex-col items-center space-y-1 transition-transform hover:scale-105"
        on:click={() => goto(slugs[i])}
      >
        <div class="relative">
          {#if era.coverUrl}
            <img src={era.coverUrl} alt={era.title} class="h-56 w-56 rounded-lg object-cover shadow-md" />
            {#if $activeEra === slugs[i]}
              <div class="pointer-events-none absolute inset-0 rounded-lg border-2 border-blue-500"></div>
            {/if}
          {/if}
        </div>
        <span class="text-center text-lg text-white">{era.title}</span>
      </div>
    {/each}
  </div>

  <!-- Main Scroll -->
  <div bind:this={mainScroll} class="flex-1 space-y-12 overflow-y-auto bg-gray-900 p-4 text-white md:p-8 relative" on:scroll={handleMainScroll}>
    {#each eras as era, i}
      <section id={`era-${slugs[i]}`} data-slug={slugs[i]} class="scroll-mt-20 space-y-6">
        <h2 class="cursor-pointer pt-4 text-3xl font-bold text-white hover:underline" on:click={() => goto(slugs[i])}>
          {era.title}
        </h2>

        {#if $visibleEras.has(slugs[i])}
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {#each era.artists as artist, idx}
              <div style="height: {artistHeight}px;" in:fly={{ y: 20, delay: idx * 100, duration: 400 }}>
                <SpotifyArtist
                  artistName={artist.name}
                  artistId={artist.artistId}
                  embedHtml={artist.embedHtml}
                  thumbnailUrl={artist.thumbnailUrl}
                  forceLoad={forceLoadMap[slugs[i]][idx]}
                  autoOpenHrefOnHover={autoOpenHrefOnHover}
                />
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-400">Scrolling to load artists...</p>
        {/if}
      </section>
    {/each}
  </div>
</div>

<style>
  :global(body) {
    background-color: #121212;
    color: #fff;
    scrollbar-width: thin;
    scrollbar-color: #555 #1e1e1e;
  }
  :global(body)::-webkit-scrollbar { width: 12px; height: 12px; }
  :global(body)::-webkit-scrollbar-track { background: #1e1e1e; border-radius: 6px; }
  :global(body)::-webkit-scrollbar-thumb { background-color: #555; border-radius: 6px; border: 3px solid #1e1e1e; }
  :global(body)::-webkit-scrollbar-thumb:hover { background-color: #888; }
</style>
