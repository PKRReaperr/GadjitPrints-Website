# Updating the product catalog

The website lists the active listings from the Gadjit Prints Etsy shop
(https://www.etsy.com/shop/GadjitNet). Etsy stays the source of truth for price, stock, options, and
orders, so the website never stores those.

The catalog has two parts:

| File | Written by | Holds |
|---|---|---|
| `src/data/etsy-listings.js` | The Etsy sync (never edit by hand) | Which listings are shown, their order, URL slug, photos, and whether they have personalization or options |
| `listingCopy` in `src/data/catalog.js` | You | The website title, short descriptor, category, description, and chips for each listing, keyed by Etsy listing ID |

## How the sync works

`scripts/etsy-sync.mjs` reads the shop's active listings through the Etsy Open API v3. It uses only
public endpoints, which need the API key alone: no OAuth, and no order, buyer, or private shop data.

- The GitHub Action `.github/workflows/etsy-sync.yml` runs it every 3 hours. Etsy's API Terms do not
  allow showing listing content more than 6 hours older than Etsy, and GitHub can delay scheduled runs.
- It commits `src/data/etsy-listings.js` only when a listing changed. That push makes Vercel redeploy.
- The API key lives only in the GitHub Actions secret `ETSY_API_KEY`, as `keystring:shared_secret`.
- Scheduled runs only happen on `main`. GitHub turns off scheduled workflows in a public repo after
  60 days without repository activity and emails a warning first; re-enable it from the Actions tab.

Safeguards (tested by `npm run test:sync` without a key):

- If any request fails, Etsy returns fewer listings than it reports, or details are missing, nothing
  is written, the run fails, and GitHub emails the failure. The site keeps the last synced list.
- Rate limits (429) and server errors are retried with backoff; a rejected key (403) is not retried.
- A shop with genuinely zero active listings writes an empty list; the site shows "New pieces are on
  the way". A shop that cannot be found is an error, not an empty list.
- Drafts, inactive, and sold-out listings are not shown. Listings without photos are skipped.
- A listing keeps its website URL even if its Etsy title changes later.
- Prices are never stored. Error messages never include the key.

## Run it yourself

```powershell
npm run sync:etsy:dry   # report what would change, write nothing
npm run sync:etsy       # write src/data/etsy-listings.js if anything changed
```

Use `sync:etsy:dry` rather than `npm run sync:etsy -- --dry-run`: Windows PowerShell can drop the `--`, and
the run would then write the file.

Without `ETSY_API_KEY` set, the script asks for the key with hidden input. Get the keystring and shared
secret from https://www.etsy.com/developers/your-apps and enter them as `keystring:shared_secret`.

In GitHub: Actions tab, "Etsy listing sync", "Run workflow". "Dry run" is ticked by default; untick it
to commit changes.

Report lines: `+` added, `-` removed (its old URL redirects to `/collection`), `~` changed, `!` skipped
with a reason, `?` shown without website copy yet.

## When you add a listing on Etsy

The next sync adds it automatically, using a short version of the Etsy title, the first paragraph of
the Etsy description, and the "New on Etsy" category. To give it website copy:

1. Find its listing ID in the sync report or in its URL: `https://www.etsy.com/listing/<listingId>/...`.
2. Add an entry to `listingCopy` in `src/data/catalog.js`:

   ```js
   '1234567890': {
     title: 'Short Product Name',
     type: 'One-line descriptor',        // optional
     category: 'Camera Gear',            // reuse an existing category when it fits
     copy: 'Two or three calm sentences written for the website.',
     includes: ['Printed in PETG', 'Made to order', 'Ships from Texas'],
   },
   ```

3. Run `npm run test:catalog` and `npm run build`, open the product page with `npm run dev`, then
   commit on a branch, check the Vercel preview, and merge to `main`.

## When you change or remove a listing on Etsy

- Photos, personalization, options, or deactivation: the next sync picks it up. Nothing to do.
- If you rewrite the description on Etsy, update that listing's `copy` in `listingCopy` if it no
  longer matches.
- Website copy for a listing that is no longer active is harmless; `npm run test:catalog` notes it so
  you can remove it.

## Pausing or undoing the sync

- Pause: Actions tab, "Etsy listing sync", "...", "Disable workflow". The site keeps the last list.
- Undo a bad sync: revert its "Sync Etsy listings" commit on `main`.
