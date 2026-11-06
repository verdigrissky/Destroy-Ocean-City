# Moving Hosting off GitHub Pages

This guide moves the frontend from GitHub Pages to Cloudflare so the repository can be made private. Once the move is done, the site no longer depends on the `gh-pages` branch, the `CNAME` file, or the `404.html` fallback.

## Why Workers Static Assets instead of a plain R2 bucket

Despite the file name, the site itself should **not** be served straight out of an R2 bucket. The app is a single-page application: routes like `/blog` and `/merch` don't exist as files and must be answered with `index.html`. R2 has no fallback rule for that, so deep links would return errors. This is the same problem GitHub Pages works around today by serving `404.html` with a `404` status.

**Workers Static Assets** is built for this. You upload the Angular build with Wrangler, and setting `not_found_handling: "single-page-application"` makes any unknown route return `index.html` with a proper `200`. Your Cloudflare account stores and serves the files, there is no bucket to manage, and serving static assets is free.

R2 is still useful for large media that shouldn't be part of the site build, such as product images. See [Optional: product images on R2](#optional-product-images-on-r2).

| | GitHub Pages (now) | Workers Static Assets |
| --- | --- | --- |
| Repo can be private | Only on a paid GitHub plan | Yes, deploys from your machine |
| Deep links (`/blog`) | `404` status with the app inside it | `200` |
| Custom domain | `CNAME` file in the deploy branch (lost on every `deploy.sh` run) | Set once in `wrangler.jsonc` |
| Cache control | None (`max-age=600` on everything) | `_headers` file |
| Deploy | Build, copy into worktree, commit, push | `npm run deploy` |

## Prerequisites

- Wrangler is already a dependency in `angular/package.json`, and you're already logged in if `printful-proxy` deploys work. Check with:

  ```bash
  cd angular
  npx wrangler whoami
  ```

- The `destroyocean.city` zone is already on Cloudflare (it's proxied today), so no nameserver changes are needed.

## 1. Add the Wrangler config

Create `angular/wrangler.jsonc`:

```jsonc
{
  "name": "destroyoceancity-site",
  "compatibility_date": "2026-10-21",
  "assets": {
    "directory": "./dist/destroyOceanCity",
    "not_found_handling": "single-page-application"
  }
}
```

There's no `main` script. This is an assets-only Worker, and Cloudflare serves the files without running any code.

> Leave `routes` out for now. The custom domain is added in step 5, after the site has been verified on `workers.dev`.

## 2. Add cache headers

Angular gives its JS and CSS hashed file names (`main-P3QPQFMX.js`), so those can be cached forever. `index.html` must always be fresh, or visitors will keep loading old builds after a deploy.

Create `angular/public/_headers`. Angular copies everything in `public/` into the build output, so this file ends up at the root of `dist/destroyOceanCity`:

```
/index.html
  Cache-Control: no-cache

/*.js
  Cache-Control: public, max-age=31536000, immutable

/styles-*.css
  Cache-Control: public, max-age=31536000, immutable

/theme-*.css
  Cache-Control: no-cache

/media/*
  Cache-Control: public, max-age=31536000, immutable
```

`theme-light.css`, `theme-dark.css` and `theme-black.css` are **not** hashed: `index.html` loads them by fixed name before the app starts. `no-cache` still lets browsers keep them, but makes them check for a newer copy on each visit. That check is a cheap `304` when nothing changed. Don't use a broad `/*.css` immutable rule, or visitors could keep an old theme indefinitely.

## 3. Add a deploy script

Add these to `scripts` in `angular/package.json`:

```json
"deploy": "ng build --configuration production && wrangler deploy",
"deploy:preview": "ng build --configuration production && wrangler versions upload"
```

`npm run deploy` replaces everything `deploy.sh` does: no worktree, no `sudo chown`, no commit to `gh-pages`, no `404.html` copy, and no `CNAME` to lose.

## 4. Deploy and verify on workers.dev

```bash
cd angular
npm run deploy
```

Wrangler prints a URL like `https://destroyoceancity-site.<account>.workers.dev`. Check:

- `/` loads.
- `/blog`, `/merch` and `/heroes` load and return `200`:

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" https://destroyoceancity-site.<account>.workers.dev/blog
  ```

- A missing asset such as `/nope.js` returns `404`, not `index.html`. The SPA fallback only applies to browser page navigations, not to script or image requests.
- `curl -sI .../main-*.js` shows the `immutable` cache header.

> **Expect the outage screen here.** The API only allows `https://destroyocean.city` as a CORS origin, so on `workers.dev` the browser blocks API responses. The app reads that as status `0` and shows the outage screen. This is the backend-failure handling working as designed (see the README). Content will load once the site is on the real domain.

## 5. Cut over the domain

This step causes a brief outage (usually under a minute), so do it at a quiet time.

1. In the Cloudflare dashboard, open **destroyocean.city → DNS** and note the current records for `destroyocean.city` and `www`. These are the GitHub Pages `A` records (`185.199.108–111.153`) and/or a `CNAME` to `verdigrissky.github.io`. Screenshot them in case you need to roll back.
2. Delete those records. Leave everything else alone, **especially `api`**.
3. Add the domain to `angular/wrangler.jsonc`:

   ```jsonc
   "routes": [
     { "pattern": "destroyocean.city", "custom_domain": true },
     { "pattern": "www.destroyocean.city", "custom_domain": true }
   ]
   ```

4. Deploy again:

   ```bash
   npm run deploy
   ```

   Wrangler creates the DNS records and certificates for the custom domains.

5. Check:

   ```bash
   curl -sI https://destroyocean.city/ | head -5
   curl -s -o /dev/null -w "%{http_code}\n" https://destroyocean.city/blog
   ```

   The first response should no longer include `x-github-request-id`, and `/blog` should return `200`.

If you'd rather have `www` redirect to the apex than serve the site too, drop the `www` route and add a Cloudflare **Redirect Rule** (`www.destroyocean.city/*` → `https://destroyocean.city/${1}`, `301`). That redirect also needs a proxied DNS record for `www` (an `AAAA` record pointing to `100::` works).

## 6. Shut down GitHub Pages

Only after the domain has served from the Worker for a day or so:

1. GitHub → **Settings → Pages**: remove the custom domain and set the source to **None**.
2. Delete the `gh-pages` branch, locally and on GitHub:

   ```bash
   git worktree remove angular-deploy --force
   git branch -D gh-pages
   git push origin --delete gh-pages
   ```

3. Delete `angular/deploy.sh` and remove `angular-deploy/` from the repo.
4. Update the **Building** and **Automatic Deployment with Github Connect** sections of `README.md` to describe `npm run deploy`.
5. GitHub → **Settings → General → Danger Zone → Change visibility → Private**.

## 7. Link previews for blog posts

When a post link is shared on social media or in a messaging app, the preview is blank: no title, image or summary. Those crawlers don't run JavaScript, and every page's HTML is the same empty `index.html` until Angular boots. Once the site is on a Worker, there are two ways to fix this.

### Option A (recommended): inject the tags in the Worker

A small Worker script runs before the static assets for `/blog/*`. It looks up the post, then rewrites `index.html` on the way out with `HTMLRewriter`, setting `<title>` and the `og:`/`twitter:` tags. The Angular app is untouched, new posts get previews immediately with no rebuild, and every other route is still served as static assets.

1. Change `angular/wrangler.jsonc` so the Worker runs first for blog URLs:

   ```jsonc
   {
     "name": "destroyoceancity-site",
     "main": "worker/index.ts",
     "compatibility_date": "2026-10-21",
     "assets": {
       "directory": "./dist/destroyOceanCity",
       "binding": "ASSETS",
       "not_found_handling": "single-page-application",
       "run_worker_first": ["/blog/*"]
     },
     "routes": [
       { "pattern": "destroyocean.city", "custom_domain": true },
       { "pattern": "www.destroyocean.city", "custom_domain": true }
     ]
   }
   ```

2. Add `angular/worker/index.ts`:

   ```ts
   interface Env { ASSETS: Fetcher }

   const API = 'https://api.destroyocean.city/json';
   const SITE = 'https://destroyocean.city';

   export default {
     async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
       const url = new URL(request.url);
       const page = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
       const slug = url.pathname.match(/^\/blog\/([^/]+)\/?$/)?.[1];
       if (!slug || slug === 'author') return page;

       const post = await lookUpPost(slug, ctx);
       if (!post) return page;

       const meta = (property: string, content: string) =>
         `<meta property="${property}" content="${escapeAttr(content)}">`;
       const tags = [
         meta('og:type', 'article'),
         meta('og:site_name', 'DESTROY OCEAN CITY!'),
         meta('og:title', post.title),
         meta('og:description', post.description),
         meta('og:url', `${SITE}/blog/${slug}`),
         post.image ? meta('og:image', post.image) : '',
         `<meta name="twitter:card" content="${post.image ? 'summary_large_image' : 'summary'}">`,
         `<meta name="description" content="${escapeAttr(post.description)}">`,
       ].join('');

       return new HTMLRewriter()
         .on('title', { element: el => { el.setInnerContent(`DOC! ${post.title}`); } })
         .on('head', { element: el => { el.append(tags, { html: true }); } })
         .transform(page);
     },
   };

   // Cached at the edge for 10 minutes so crawlers don't hit the backend on every share
   async function lookUpPost(slug: string, ctx: ExecutionContext) {
     const apiUrl = `${API}/posts?slug=${encodeURIComponent(slug)}&_embed`;
     const res = await fetch(apiUrl, {
       headers: { Origin: SITE },
       cf: { cacheTtl: 600, cacheEverything: true },
     });
     if (!res.ok) return null;
     const [p] = await res.json<any[]>();
     if (!p) return null;
     const media = p._embedded?.media?.[0];
     return {
       title: plain(p.title.rendered),
       description: plain(p.excerpt.rendered).slice(0, 200),
       image: media?.media_details?.sizes?.large?.source_url ?? media?.media_details?.sizes?.medium_large?.source_url ?? media?.source_url ?? null,
     };
   }

   // Strip tags and decode the common entities the CMS emits
   function plain(html: string): string {
     return html.replace(/<[^>]*>/g, '')
       .replace(/&#8217;|&#039;/g, "'").replace(/&#8220;|&#8221;|&quot;/g, '"')
       .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—').replace(/&hellip;|&#8230;/g, '…')
       .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
   }

   function escapeAttr(value: string): string {
     return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
   }
   ```

3. Check that the API allows this server-side request. It sends `Origin: https://destroyocean.city`, but nginx may filter on more than that. If the CMS façade from `API-HARDENING.md` exists by then, read from that instead of the raw API.
4. Deploy, then check what a crawler sees:

   ```bash
   curl -s https://destroyocean.city/blog/killing-two-birds-with-one-windmill | grep -E 'og:|<title>'
   ```

   Then paste a post URL into a preview tool, such as the opengraph.xyz debugger or a private message to yourself.

The Worker only touches `/blog/<slug>`. The author pages, the blog index, and every other route are still served as static assets. When the backend is down or the post doesn't exist, the plain `index.html` goes out unchanged, and the app's maintenance and not-found screens take over as usual.

### Option B: prerender every post at build time

Angular can render each post to real HTML during `ng build` (`ng add @angular/ssr`, `outputMode: "static"`, and a `getPrerenderParams` that fetches every slug). That gives crawlers the full article text, not just the preview tags. But it's a much bigger change for this app:

- `ThemeService`, `MaintenanceService`, the sloganator and the lightbox touch `window`, `document` and `localStorage` at startup. Each needs a browser-only guard before the build can render anything.
- The startup API check would run during the build. If the API is down at build time, every page would be prerendered as the maintenance screen.
- The sanitizer (DOMPurify) and `plainText()` rely on a browser DOM. They need server-safe versions.
- A new post has no prerendered page until the next deploy. It still works through the SPA fallback, but without a preview.

Prerendering mainly helps search engines index the full article text; link previews only need the tags. So use Option A unless search ranking becomes a goal.

## Rollback

Until step 6, rolling back is just DNS:

1. Remove the `routes` block from `wrangler.jsonc` and run `npm run deploy` (or delete the custom domains under **Workers & Pages → destroyoceancity-site → Settings → Domains & Routes**).
2. Recreate the GitHub Pages DNS records from your screenshot.
3. Make sure the custom domain is still set in GitHub **Settings → Pages**, and run `./deploy.sh` if the `CNAME` file is missing.

If a deploy itself goes bad after the move, Workers keeps previous versions:

```bash
npx wrangler rollback
```

## What doesn't change

- **Backend maintenance and outage screens.** They live entirely in the Angular app and work the same on any host.
- **The API's CORS allow-list.** The site keeps the `https://destroyocean.city` origin, so the backend needs no changes.
- **`printful-proxy`.** It stays a separate Worker at `dropship.destroyocean.city`.

## Optional: product images on R2

Product images are currently `rsync`ed to the VPS by `products-deploy/upload.sh` and served from `images.destroyocean.city`. Moving them to R2 takes another job off the VPS, and R2 charges nothing for egress.

1. Create a bucket:

   ```bash
   npx wrangler r2 bucket create destroyoceancity-images
   ```

2. In the dashboard, open **R2 → destroyoceancity-images → Settings → Custom Domains** and connect `images.destroyocean.city`. First remove the existing DNS record that points at the VPS.
3. Upload objects so their keys match the paths the app requests now: `products/<slug>/<slug>_<angle>_<size>.png`. See `IMAGE_BASE` in `product-viewer.ts` and `product-previewer.ts`; the previewer uses size `600`.

   **The VPS currently creates those sized files.** `upload.sh` sends full-size `<slug>_<angle>.png` originals to `/var/www/product-images/incoming/`, and the server produces the `_<size>` variants. Before switching, either:
   - **copy the existing processed files** off the VPS into R2 as they are (simplest, and enough if products rarely change):

     ```bash
     rsync -av chartreusesky@141.140.12.238:/var/www/product-images/products/ ./r2-export/
     rclone copy ./r2-export r2:destroyoceancity-images/products
     ```

     (Check the actual output directory on the VPS first; `products/` is a guess.)
   - **or move the resizing into `upload.sh`**, for example with `sips` or ImageMagick, so new products are resized locally before upload.

   For bulk uploads, use `rclone` or the AWS CLI with an R2 API token instead of one `wrangler r2 object put` call per file.

4. Replace the `rsync` line in `upload.sh` with the R2 upload.
