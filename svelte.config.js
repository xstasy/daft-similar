import adapter from '@sveltejs/adapter-static';
import sveltePreprocess from 'svelte-preprocess';

export default {
  preprocess: [sveltePreprocess()],
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html', // SPA fallback for dynamic routes
      strict: false
    })
  }
};