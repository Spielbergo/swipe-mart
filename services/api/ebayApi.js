/**
 * eBay Browse API adapter
 * https://developer.ebay.com/api-docs/buy/browse/overview.html
 *
 * Setup (5 min):
 *  1. Create a free eBay developer account at https://developer.ebay.com
 *  2. Create an application → copy your Production Client ID and Client Secret
 *  3. In the Netlify dashboard → Site Settings → Environment Variables, add:
 *       EBAY_CLIENT_ID      (your Production Client ID)
 *       EBAY_CLIENT_SECRET  (your Production Client Secret)
 *  4. In your .env, set:
 *       EXPO_PUBLIC_EBAY_ENABLED=true
 *
 * Token exchange happens inside the Netlify Function (netlify/functions/ebay-token.js)
 * so your client secret is never exposed in browser/app code.
 */

const BROWSE_API = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

// Simple in-memory token cache (lasts for the browser session)
let _cachedToken = null;
let _tokenExpiresAt = 0;

/**
 * Fetch an app-level OAuth token via our Netlify proxy function.
 * Falls back gracefully if not deployed or credentials not set.
 */
async function getAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiresAt) {
    return _cachedToken;
  }

  // Works when deployed to Netlify; safe no-op in local Expo dev
  const endpoint = '/.netlify/functions/ebay-token';
  const res = await fetch(endpoint);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`eBay token error: ${body.error ?? res.status}`);
  }

  const { access_token, expires_in } = await res.json();
  _cachedToken = access_token;
  _tokenExpiresAt = Date.now() + (expires_in - 60) * 1000; // 60 s buffer
  return _cachedToken;
}

/**
 * Normalize an eBay item summary into our internal product shape.
 */
function normalizeItem(item) {
  const rawPrice = parseFloat(item.price?.value ?? '0');
  const originalPrice = parseFloat(item.marketingPrice?.originalPrice?.value ?? rawPrice);

  let discountPct = 0;
  if (originalPrice > rawPrice) {
    discountPct = ((originalPrice - rawPrice) / originalPrice) * 100;
  }

  return {
    id: `ebay_${item.itemId}`,
    title: item.title ?? 'eBay Listing',
    description: item.shortDescription ?? '',
    price: rawPrice,
    originalPrice,
    discountPercentage: discountPct,
    rating: 0, // eBay Browse API doesn't expose star ratings
    reviewCount: 0,
    stock: item.estimatedAvailabilities?.[0]?.estimatedAvailableQuantity ?? 1,
    brand: item.brand ?? '',
    category: item.categories?.[0]?.categoryName ?? 'General',
    thumbnail: item.image?.imageUrl ?? '',
    images: item.additionalImages
      ? [item.image?.imageUrl, ...item.additionalImages.map((i) => i.imageUrl)].filter(Boolean)
      : [item.image?.imageUrl].filter(Boolean),
    source: 'eBay',
    sourceUrl: item.itemAffiliateWebUrl ?? item.itemWebUrl ?? null,
    condition: item.condition ?? '',
    sellerName: item.seller?.username ?? '',
    sellerFeedback: item.seller?.feedbackPercentage ?? '',
    tags: [],
  };
}

/**
 * Search eBay listings by keyword.
 * @param {string} query
 * @param {{ limit?: number, skip?: number, location?: object }} options
 */
export async function searchProducts(query, { limit = 20, skip = 0 } = {}) {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    offset: String(skip),
    fieldgroups: 'MATCHING_ITEMS,ADDITIONAL_IMAGES',
  });

  const res = await fetch(`${BROWSE_API}?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`eBay search failed (${res.status}): ${JSON.stringify(body.errors?.[0])}`);
  }

  const json = await res.json();
  return {
    products: (json.itemSummaries ?? []).map(normalizeItem),
    total: json.total ?? 0,
  };
}

/**
 * Browse eBay listings without a specific keyword (trending / general).
 * Uses 'deals' as a broad catch-all query when no topic is provided.
 */
export async function browseProducts({ limit = 20, skip = 0 } = {}) {
  return searchProducts('deals', { limit, skip });
}
