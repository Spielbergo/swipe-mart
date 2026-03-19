/**
 * DummyJSON API  –  https://dummyjson.com
 *
 * Completely free, no API key required.
 * Rich product catalog with search, categories, pagination and real-ish data.
 */

const BASE_URL = 'https://dummyjson.com';

/**
 * Normalize a DummyJSON product into our internal shape.
 */
function normalizeProduct(item) {
  return {
    id: `dummyjson_${item.id}`,
    title: item.title,
    description: item.description,
    price: item.price,
    originalPrice: item.price + (item.price * (item.discountPercentage / 100)),
    discountPercentage: item.discountPercentage,
    rating: item.rating,
    reviewCount: item.reviews?.length ?? 0,
    stock: item.stock,
    brand: item.brand ?? item.category,
    category: item.category,
    thumbnail: item.thumbnail,
    images: item.images ?? [item.thumbnail],
    source: 'DummyJSON',
    sourceUrl: null,
    tags: item.tags ?? [],
  };
}

/**
 * Search products by keyword.
 * @param {string} query
 * @param {{ limit?: number, skip?: number }} options
 */
export async function searchProducts(query, { limit = 20, skip = 0 } = {}) {
  const encodedQuery = encodeURIComponent(query);
  const res = await fetch(
    `${BASE_URL}/products/search?q=${encodedQuery}&limit=${limit}&skip=${skip}`
  );
  if (!res.ok) throw new Error(`DummyJSON search failed: ${res.status}`);
  const json = await res.json();
  return {
    products: json.products.map(normalizeProduct),
    total: json.total,
  };
}

/**
 * Fetch products by category.
 * @param {string} category
 * @param {{ limit?: number, skip?: number }} options
 */
export async function getProductsByCategory(category, { limit = 20, skip = 0 } = {}) {
  const res = await fetch(
    `${BASE_URL}/products/category/${encodeURIComponent(category)}?limit=${limit}&skip=${skip}`
  );
  if (!res.ok) throw new Error(`DummyJSON category fetch failed: ${res.status}`);
  const json = await res.json();
  return {
    products: json.products.map(normalizeProduct),
    total: json.total,
  };
}

/**
 * Fetch all available categories.
 */
export async function getCategories() {
  const res = await fetch(`${BASE_URL}/products/category-list`);
  if (!res.ok) throw new Error(`DummyJSON categories fetch failed: ${res.status}`);
  return res.json(); // string[]
}

/**
 * Fetch a general batch of products (no keyword – used as a "browse" feed).
 * @param {{ limit?: number, skip?: number }} options
 */
export async function browseProducts({ limit = 20, skip = 0 } = {}) {
  const res = await fetch(`${BASE_URL}/products?limit=${limit}&skip=${skip}`);
  if (!res.ok) throw new Error(`DummyJSON browse failed: ${res.status}`);
  const json = await res.json();
  return {
    products: json.products.map(normalizeProduct),
    total: json.total,
  };
}
