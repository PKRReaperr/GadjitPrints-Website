// Syncs the active Etsy listings into src/data/etsy-listings.js.
//
//   npm run sync:etsy:dry            report what would change, write nothing
//   npm run sync:etsy                write the file if anything changed
//
// The API key ("keystring:shared_secret") is read from the ETSY_API_KEY environment variable.
// When it is missing and the script runs in a terminal, it asks for the key with hidden input.
// The key is never printed or written to disk.
import fs from 'node:fs';
import readline from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { etsyShopUrl, listingCopy } from '../src/data/catalog.js';
import {
  EtsySyncError,
  diffListings,
  fetchActiveListings,
  formatReport,
  isWellFormedApiKey,
  normalizeListings,
  renderListingsModule,
} from './etsy-sync-lib.mjs';

const listingsFile = fileURLToPath(new URL('../src/data/etsy-listings.js', import.meta.url));
const dryRun = process.argv.includes('--dry-run');
const shopName = new URL(etsyShopUrl).pathname.split('/').filter(Boolean).pop();

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
    // The question is already on screen; hide everything typed after it.
    rl._writeToOutput = () => {};
  });
}

async function readApiKey() {
  if (process.env.ETSY_API_KEY) return process.env.ETSY_API_KEY.trim();
  if (process.stdin.isTTY) return askHidden('Etsy API key (keystring:shared_secret, input hidden): ');
  return '';
}

function writeGitHubOutputs(report, changed) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Etsy listing sync\n\n\`\`\`\n${report}\n\`\`\`\n`);
  }
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
}

async function main() {
  const apiKey = await readApiKey();
  if (!isWellFormedApiKey(apiKey)) {
    throw new EtsySyncError('ETSY_API_KEY is missing or not in the form keystring:shared_secret');
  }
  // Confirm the key arrived, so it is not pasted again at the shell prompt.
  console.log('Key received. Contacting Etsy...');

  const previous = (await import(`${pathToFileURL(listingsFile).href}?t=${Date.now()}`)).default;
  const { listings: etsyListings } = await fetchActiveListings({ shopName, apiKey });
  const { listings, warnings } = normalizeListings(etsyListings, previous);
  const diff = diffListings(previous, listings);
  const needsCopy = listings.filter((listing) => !listingCopy[listing.listingId]);

  const nextSource = renderListingsModule(listings);
  const currentSource = fs.readFileSync(listingsFile, 'utf8').replace(/\r\n/g, '\n');
  const shouldWrite = !dryRun && nextSource !== currentSource;
  if (shouldWrite) fs.writeFileSync(listingsFile, nextSource);

  const report = formatReport({ diff, warnings, needsCopy, total: listings.length, dryRun, wrote: shouldWrite });
  console.log(report);
  writeGitHubOutputs(report, shouldWrite);
}

main().catch((error) => {
  const message = error instanceof EtsySyncError ? error.message : `unexpected error: ${error?.message ?? error}`;
  console.error(`Etsy sync failed: ${message}`);
  console.error('Nothing was written; the website keeps the last synced listings.');
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Etsy listing sync failed\n\n${message}\n`);
  }
  process.exit(1);
});
