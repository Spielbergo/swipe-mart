import { useState, useEffect, useCallback, useRef } from 'react';
import { searchAllSources, browseAllSources } from '../services/api';

const PAGE_SIZE = 20;

export function useProducts(query, location) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const skipRef = useRef(0);
  const seenIdsRef = useRef(new Set());
  const queryRef = useRef(query);

  // Reset when the search query changes
  useEffect(() => {
    queryRef.current = query;
    skipRef.current = 0;
    seenIdsRef.current = new Set();
    setProducts([]);
    setHasMore(true);
    setError(null);
    fetchPage(query, 0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchPage = useCallback(async (searchQuery, skip, replace = false) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (searchQuery && searchQuery.trim()) {
        result = await searchAllSources(searchQuery.trim(), { limit: PAGE_SIZE, skip, location });
      } else {
        result = await browseAllSources({ limit: PAGE_SIZE, skip, location });
      }

      // De-duplicate
      const fresh = result.filter((p) => !seenIdsRef.current.has(p.id));
      fresh.forEach((p) => seenIdsRef.current.add(p.id));

      if (fresh.length < PAGE_SIZE) setHasMore(false);

      setProducts((prev) => (replace ? fresh : [...prev, ...fresh]));
      skipRef.current = skip + PAGE_SIZE;
    } catch (err) {
      setError(err.message);
      console.error('[useProducts]', err);
    } finally {
      setLoading(false);
    }
  }, [location]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPage(queryRef.current, skipRef.current);
    }
  }, [loading, hasMore, fetchPage]);

  const refresh = useCallback(() => {
    skipRef.current = 0;
    seenIdsRef.current = new Set();
    setHasMore(true);
    fetchPage(queryRef.current, 0, true);
  }, [fetchPage]);

  return { products, loading, error, hasMore, loadMore, refresh };
}
