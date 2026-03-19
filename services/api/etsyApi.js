/**
 * Etsy Open API v3 adapter
 * https://developers.etsy.com/documentation/
 *
 * Setup (10–15 min):
 *  1. Sign in to https://www.etsy.com/developers
 *  2. Create an app (even a placeholder name/description is fine)
 *  3. Copy your API key (keystring)
 *  4. In your .env, set:
 *       EXPO_PUBLIC_ETSY_API_KEY=your_key_here
 *
 * No OAuth required for reading public listings — the API key alone is enough.
 */

const BASE_URL = 'https://openapi.etsy.com/v3/application';
const API_KEY = process.env.EXPO_PUBLIC_ETSY_API_KEY;

/**
 * Normalize an Etsy listing into our internal product shape.
 */
function normalizeListing(item) {
  const price = (item.price?.amount ?? 0) / (item.price?.divisor ?? 100);

  // MainImage is included when ?includes=MainImage is passed
  const imageUrl = item.MainImage?.url_570xN
    ?? item.images?.[0]?.url_570xN
    ?? '';

  return {
    id: `etsy_${item.listing_id}`,
    title: item.title ?? 'Etsy Listing',
    description: item.description
      ? item.description.replace(/<[^>]*>/g, '').slice(0, 300)
      : '',
    price,
    originalPrice: price,
    discountPercentage: 0,
    rating: 0,
    reviewCount: 0,
    stock: item.quantity ?? 1,
    brand: item.seller_name ?? '',
    category: item.taxonomy_path?.[0] ?? item.primary_color ?? 'Handmade',
    thumbnail: imageUrl,
    images: item.images
      ? item.images.map((img) => img.url_570xN).filter(Boolean)
      : imageUrl
      ? [imageUrl]
      : [],
    source: 'Etsy',
    sourceUrl: item.url ?? null,
    tags: item.tags ?? [],
  };
}

/**
 * Search Etsy listings by keyword.
 * @param {string} query
 * @param {{ limit?: number, skip?: number }} options
 */
export async function searchProducts(query, { limit = 20, skip = 0 } = {}) {
  const params = new URLSearchParams({
    keywords: query,
    limit: String(Math.min(limit, 100)), // Etsy max is 100
    offset: String(skip),
    'includes[0]': 'MainImage',
    sort_on: 'score',
    sort_order: 'desc',
  });

  const res = await fetch(`${BASE_URL}/listings/active?${params}`, {
    headers: {
      'x-api-key': API_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Etsy search failed (${res.status}): ${body.error ?? res.statusText}`);
  }

  const json = await res.json();
  return {
    products: (json.results ?? []).map(normalizeListing),
    total: json.count ?? 0,
  };
}

/**
 * Browse Etsy listings without a specific keyword (trending / featured).
 * Uses a recent sort to surface fresh listings.
 */
export async function browseProducts({ limit = 20, skip = 0 } = {}) {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 100)),
    offset: String(skip),
    'includes[0]': 'MainImage',
    sort_on: 'created',
    sort_order: 'desc',
  });

  const res = await fetch(`${BASE_URL}/listings/active?${params}`, {
    headers: {
      'x-api-key': API_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Etsy browse failed (${res.status}): ${body.error ?? res.statusText}`);
  }

  const json = await res.json();
  return {
    products: (json.results ?? []).map(normalizeListing),
    total: json.count ?? 0,
  };
}
