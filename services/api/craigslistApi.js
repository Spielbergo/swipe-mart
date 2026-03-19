/**
 * Craigslist adapter — powered by craigslist-data on RapidAPI
 * https://rapidapi.com/ntd119/api/craigslist-data
 *
 * Setup:
 *  Add to .env:
 *    EXPO_PUBLIC_CRAIGSLIST_KEY=your_rapidapi_key
 *
 * Notes:
 *  - Listings don't include images; a Craigslist placeholder is shown instead.
 *  - The API accepts city names ("new york", "los angeles"), not lat/lng.
 *    We reverse-geocode the device location via Nominatim (free, no key).
 *  - POST /search  — keyword search
 *  - GET  /categories — category list (not used for product browsing)
 */

const BASE_URL = 'https://craigslist-data.p.rapidapi.com';
const API_KEY = process.env.EXPO_PUBLIC_CRAIGSLIST_KEY;

// Craigslist for-sale category short-codes we actually want
const FOR_SALE_CATEGORY = 'sss'; // "for sale — all"

// Cache reverse-geocode result for the session so we only call once
let _cachedCityName = null;

/**
 * Convert {latitude, longitude} → city name string for the Craigslist API.
 * Falls back to "new york" on any error.
 */
async function getCityName(location) {
  if (_cachedCityName) return _cachedCityName;
  if (!location?.latitude) return 'new york';

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
      { headers: { 'User-Agent': 'SwipeMart/1.0' } }
    );
    const json = await res.json();
    // Prefer city > town > county > state
    const city =
      json.address?.city ||
      json.address?.town ||
      json.address?.village ||
      json.address?.county ||
      'new york';
    _cachedCityName = city.toLowerCase();
    return _cachedCityName;
  } catch {
    return 'new york';
  }
}

/**
 * Parse a Craigslist price string like "$150" or "$1,200" → number.
 * Returns 0 for free / missing / "$0".
 */
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Normalize a Craigslist listing into our internal product shape.
 */
function normalizeListing(item, index) {
  const price = parsePrice(item.price);
  // Extract a slug ID from the URL (last path segment without extension)
  const urlId = item.url
    ? item.url.split('/').pop().replace(/\.[^.]+$/, '').replace(/\D/g, '') || String(index)
    : String(index);

  return {
    id: `craigslist_${urlId}`,
    title: item.title ?? 'Craigslist Listing',
    description: `Listed in ${item.location ?? 'your area'} on Craigslist.`,
    price,
    originalPrice: price,
    discountPercentage: 0,
    rating: 0,
    reviewCount: 0,
    stock: 1,
    brand: '',
    category: 'For Sale',
    // No images in the API — use a neutral placeholder so ProductCard shows the emoji fallback
    thumbnail: '',
    images: [],
    source: 'Craigslist',
    sourceUrl: item.url ?? null,
    tags: [],
    sellerLocation: item.location ?? '',
  };
}

/**
 * Search Craigslist listings by keyword.
 * @param {string} query
 * @param {{ limit?: number, skip?: number, location?: object }} options
 */
export async function searchProducts(query, { limit = 20, skip = 0, location } = {}) {
  const cityName = await getCityName(location);
  const page = Math.floor(skip / limit);

  const res = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'craigslist-data.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      location: cityName,
      limit,
      page,
      category: FOR_SALE_CATEGORY,
      has_pic: false,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Craigslist search failed (${res.status}): ${body.message ?? res.statusText}`);
  }

  const json = await res.json();
  const listings = json.data ?? [];

  return {
    products: listings.map(normalizeListing),
    total: json.meta?.results ?? listings.length,
  };
}

/**
 * Browse Craigslist for-sale listings without a keyword.
 * @param {{ limit?: number, skip?: number, location?: object }} options
 */
export async function browseProducts({ limit = 20, skip = 0, location } = {}) {
  // "stuff" is a broad Craigslist search that surfaces general for-sale items
  return searchProducts('stuff', { limit, skip, location });
}
