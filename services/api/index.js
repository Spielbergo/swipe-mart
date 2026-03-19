/**
 * Unified product API layer.
 *
 * Sources auto-enable based on environment variables:
 *  - DummyJSON  — always active (no key needed, development fallback)
 *  - eBay       — enabled when EXPO_PUBLIC_EBAY_ENABLED=true
 *                 (set EBAY_CLIENT_ID + EBAY_CLIENT_SECRET in Netlify dashboard)
 *  - Etsy       — enabled when EXPO_PUBLIC_ETSY_API_KEY is set
 *
 * To add another source:
 *  1. Create services/api/myNewApi.js exporting searchProducts() + browseProducts()
 *  2. Import it below and add to the buildSources() array with an env-var guard.
 */

import * as dummyJson from './dummyJsonApi';
import * as ebayApi from './ebayApi';
import * as etsyApi from './etsyApi';

const EBAY_ENABLED = process.env.EXPO_PUBLIC_EBAY_ENABLED === 'true';
const ETSY_ENABLED = Boolean(process.env.EXPO_PUBLIC_ETSY_API_KEY);

function buildSources() {
  const sources = [dummyJson];
  if (EBAY_ENABLED) {
    sources.push(ebayApi);
    console.log('[API] eBay source enabled');
  }
  if (ETSY_ENABLED) {
    sources.push(etsyApi);
    console.log('[API] Etsy source enabled');
  }
  return sources;
}

const SOURCES = buildSources();

/**
 * Search across all configured sources.
 * @param {string}  query
 * @param {object}  opts
 * @param {number}  [opts.limit=20]
 * @param {number}  [opts.skip=0]
 * @param {object}  [opts.location]   { latitude, longitude }
 */
export async function searchAllSources(query, opts = {}) {
  const results = await Promise.allSettled(
    SOURCES.map((src) => src.searchProducts(query, opts))
  );

  const products = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      products.push(...result.value.products);
    } else {
      console.warn('[API] Source failed:', result.reason?.message);
    }
  });

  return shuffleArray(products);
}

/**
 * Browse (no keyword) across all sources.
 * Pass { category } in opts to filter by category.
 * @param {object} opts
 * @param {string} [opts.category]
 */
export async function browseAllSources(opts = {}) {
  const results = await Promise.allSettled(
    SOURCES.map((src) => src.browseProducts(opts))
  );

  const products = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      products.push(...result.value.products);
    } else {
      console.warn('[API] Browse source failed:', result.reason?.message);
    }
  });

  return shuffleArray(products);
}

/**
 * Fetch categories from the primary source.
 */
export async function getCategories() {
  return dummyJson.getCategories();
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
