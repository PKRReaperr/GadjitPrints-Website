# Updating the product catalog

The website lists the active listings from the Gadjit Prints Etsy shop
(https://www.etsy.com/shop/GadjitNet). Until the Etsy API sync is set up, the list is maintained by
hand in `src/data/catalog.js`. Etsy stays the source of truth for price, stock, options, and orders,
so the website never stores those.

## Add a new listing

1. Publish the listing in Etsy Shop Manager and make sure it is active.
2. Copy the listing ID from its URL: `https://www.etsy.com/listing/<listingId>/...`.
3. Get the photo URLs. On the listing page, open each photo and copy its image address. It looks like
   `https://i.etsystatic.com/<shop>/r/il/<hash>/<photoId>/il_fullxfull.<photoId>_<key>.jpg`.
   Replace `il_fullxfull` (or any other size) with `il_794xN` so the site loads a 794 px wide image.
4. Add an entry to `products` in `src/data/catalog.js`:

   ```js
   {
     slug: 'short-readable-name',        // becomes /collection/short-readable-name; never change it later
     title: 'Short Product Name',
     type: 'One-line descriptor',        // optional
     category: 'Camera Gear',            // reuse an existing category when it fits
     imageUrls: ['https://i.etsystatic.com/.../il_794xN....jpg'],
     copy: 'Two or three calm sentences written for the website.',
     includes: ['Printed in PETG', 'Made to order', 'Ships from Texas'],
     etsy: {
       listingId: '1234567890',
       personalization: 'none',          // 'optional' or 'required' if the listing has a personalization box
       hasOptions: false,                // true if the listing has variations (size, color, ...)
     },
   },
   ```

   Personalization or variations switch the button to "Customize on Etsy"; otherwise it says "View on Etsy".
5. Run the checks:

   ```bash
   npm run test:catalog
   npm run build
   ```

6. Run `npm run dev`, open the new product page, and click the Etsy button to confirm it opens the right listing.
7. Commit on a branch, push, check the Vercel preview, then merge to `main`.

## Update a listing

- Edited title, description, or photos on Etsy: update `title`, `copy`, or `imageUrls` to match.
- Added personalization or variations on Etsy: update `etsy.personalization` or `etsy.hasOptions`.
- Keep the `slug` the same so existing links keep working.

## Remove a listing (sold out, deactivated, or deleted on Etsy)

Delete its entry from `products`. Its old URL then redirects to `/collection`. If the shop has no active
listings at all, `/collection` shows "New pieces are on the way" with a link to the Etsy shop.

## Later: automatic sync with the Etsy API

When Etsy developer access is approved, a read-only sync can replace these manual steps:

- A script fetches the shop's active listings and photos with Etsy Open API v3, reading 100 listings per page.
- A daily GitHub Action runs it with the API key stored in GitHub Secrets, commits the result when listings
  change, and Vercel redeploys. The site never calls Etsy while customers browse.
- If Etsy really returns zero active listings, the empty list is written and the site shows the empty state.
- If the request fails, nothing is written, the Action fails visibly, and the last good list stays live.
- Before building it, check Etsy's current API documentation for endpoints, rate limits, caching rules,
  and the required attribution notice.
