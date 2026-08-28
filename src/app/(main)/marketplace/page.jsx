'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubHeader from '@/components/organisms/SubHeader/SubHeader';
import CardOriginal from '@/components/organisms/CardOriginal/CardOriginal';
import CardSellingListModal from '@/components/organisms/CardSellingListModal/CardSellingListModal';
import { http } from '@/lib/http/client';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { toApiGrade, toDisplayGrade } from '@/utils/grade';
import { formatPoints } from '@/utils/points';
import styles from './page.module.css';

const LISTINGS_LIMIT = 10;

/**
 * API 리스팅 항목을 카드 표시용 객체로 변환
 */
function listingToCard(item) {
  const pc = item?.photoCard ?? {};
  const quantity = Number(item?.quantity ?? 0);
  const pricePerUnit = item?.pricePerUnit ?? 0;

  const imageSrc = normalizeImageUrl(pc?.imageUrl ?? pc?.image_url) || '/assets/products/photo-card.svg';

  return {
    id: item?.listingId,
    rarity: toDisplayGrade(pc?.grade),
    category: pc?.genre ?? '풍경',
    owner: item?.sellerNickname ?? '판매자',
    description: pc?.name || pc?.title || '-',
    price: formatPoints(pricePerUnit),
    remaining: quantity,
    outof: quantity,
    imageSrc,
  };
}


// sort 값 → BE 파라미터 변환
function sortToParams(sort) {
  if (sort === 'lowPrice') return { sortBy: 'price', sortOrder: 'ASC' };
  if (sort === 'highPrice') return { sortBy: 'price', sortOrder: 'DESC' };
  return { sortBy: 'reg_date', sortOrder: 'DESC' }; // newest (기본)
}

export default function MarketplacePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [isSellingModalOpen, setIsSellingModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    rarity: 'all',
    genre: 'all',
    soldout: 'all',
    sort: 'newest',
  });
  const loadMoreRef = useRef(null);

  const [listings, setListings] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data } = await http.get('/users/me');
        setCurrentUser(data?.user ?? null);
      } catch (err) {
        setCurrentUser(null);
        if (err?.response?.status === 401) {
          router.replace('/auth/login');
        }
      }
    }
    fetchUser();
  }, [router]);

  const fetchListings = useCallback(async (cursor = null, append = false, currentFilters) => {
    const isLoadMore = append && cursor != null;
    if (isLoadMore) setLoadMoreLoading(true);
    else setLoading(true);

    setError(null);
    try {
      const { rarity, genre, soldout, sort } = currentFilters;
      const { sortBy, sortOrder } = sortToParams(sort);

      const params = new URLSearchParams({ limit: String(LISTINGS_LIMIT), sortBy, sortOrder });
      if (cursor != null) params.set('cursor', String(cursor));
      const grade = toApiGrade(rarity);
      if (grade) params.set('grade', grade);
      if (genre && genre !== 'all') params.set('genre', genre);
      if (soldout && soldout !== 'all') params.set('status', soldout);

      const res = await http.get(`/api/listings?${params.toString()}`);
      const data = res.data?.data;
      const items = data?.items ?? [];
      const next = data?.nextCursor ?? null;

      const cards = items.map(listingToCard);
      setListings((prev) => (append ? [...prev, ...cards] : cards));
      setNextCursor(next);
    } catch (err) {
      setError(err?.message ?? '리스팅을 불러오지 못했습니다.');
      if (!append) setListings([]);
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  }, []);

  // 필터 변경 시 처음부터 다시 조회
  useEffect(() => {
    fetchListings(null, false, filters);
  }, [filters, fetchListings]);

  const hasMore = nextCursor != null;

  const loadMore = useCallback(
    (entries) => {
      const [entry] = entries;
      if (!entry?.isIntersecting || loadMoreLoading || !hasMore) return;
      fetchListings(nextCursor, true, filters);
    },
    [nextCursor, loadMoreLoading, hasMore, fetchListings, filters],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loadMore, {
      rootMargin: '200px',
      threshold: 0.1,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div className="w-full bg-black text-white">
      <SubHeader
        onSellClick={() => setIsSellingModalOpen(true)}
        onCreateClick={() => router.push('/create-card')}
        filters={filters}
        onFiltersChange={setFilters}
        cards={listings}
      />

      <div className={`mx-auto w-full max-w-[1280px] px-5 py-10 ${styles.listWrapper}`}>
        <div className={styles.cardGrid}>
          {listings.map((card) => (
            <CardOriginal
              key={card.id}
              rarity={card.rarity}
              category={card.category}
              owner={card.owner}
              description={card.description}
              price={card.price}
              remaining={card.remaining}
              outof={card.outof}
              imageSrc={card.imageSrc}
              onClick={() => router.push(`/marketplace/${card.id}`)}
              detailHref={`/marketplace/${card.id}`}
            />
          ))}
        </div>

        {hasMore && <div ref={loadMoreRef} className={styles.sentinel} />}
      </div>

      <CardSellingListModal
        open={isSellingModalOpen}
        onClose={() => setIsSellingModalOpen(false)}
        onSellCardSelect={() => {
          setIsSellingModalOpen(false);
          router.push('/marketplace/sell');
        }}
        onSellSuccess={() => {
          setIsSellingModalOpen(false);
          fetchListings(null, false, filters);
          router.push('/marketplace');
        }}
        sellerUserId={currentUser?.id}
      />
    </div>
  );
}
