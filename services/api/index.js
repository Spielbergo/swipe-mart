/**
 * Unified product API layer.
 *
 * All platform adapters (DummyJSON, eBay, Etsy, Best Buy, etc.) should export
 * functions matching the same signature so they can be easily swapped or
 * combined here.
 *
 * Current free sources:
 *  - DummyJSON  (no key)  – great for development
 *
 * How to add a new source:
 *  1. Create services/api/myNewApi.js that exports searchProducts(), browseProducts()
 *  2. Import it here and add it to the SOURCES array.
 *  3. The aggregator below will fan the query out to every source and merge results.
 */

import * as dummyJson from './dummyJsonApi';
// import * as etsyApi   from './etsyApi';    // add when you have an API key
// import * as ebayApi   from './ebayApi';

const SOURCES = [dummyJson];

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
 * @param {object} opts
 */
export async function browseAllSources(opts = {}) {
  const results = await Promise.allSettled(
    SOURCES.map((src) => src.browseProducts(opts))
  );

  const products = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      products.push(...result.value.products);
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
