import { eras } from "../src/lib/eras.ts";
import fs from 'fs';
import fetch from 'node-fetch';
import path from "path";

// Simple delay function
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOEmbeds() {
  for (const era of eras) {
    for (const artist of era.artists) {
      try {
        const res = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/artist/${artist.artistId}`);
        if(res.status === 200) {
            const data: any = await res.json();

            // Add processed HTML with lazy loading
            (artist as any).embedHtml = data.html.replace(
            /<iframe /,
            '<iframe loading="lazy" referrerpolicy="no-referrer" '
            );
            (artist as any).thumbnailUrl = data.thumbnail_url;

            // Delay to avoid rate limit (adjust as needed)
            await delay(300); // 300ms between requests
        } else console.log(`Failed at ${artist.name}`)
      } catch (err) {
        console.error(`Failed to fetch oEmbed for ${artist.name}`, err);
      }
    }
  }

  fs.writeFileSync(path.join(process.cwd(), 'src/lib/eras.json'), JSON.stringify(eras, null, 2));
  console.log('Saved pre-fetched oEmbed HTML for all artists!');
}

fetchOEmbeds();
