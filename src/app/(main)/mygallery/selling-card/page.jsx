'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useBreakpoint from '@/hooks/useBreakpoint';

import CardOriginal from '@/components/organisms/CardOriginal/CardOriginal';
import GradeChips from '../_components/GradeChips';
import Pagination from '../_components/Pagination';
import MyGalleryFilterBar from '../_components/MyGalleryFilterBar';
import MyGalleryMobileHeader from '../_components/MyGalleryMobileHeader';
import { useMyGalleryCount } from '../_components/MyGalleryCountContext';
import { API_BASE } from '@/lib/http/baseUrl';
import { normalizeImageUrl } from '@/utils/imageUrl';

import styles from './page.module.css';

const PAGE_SIZE = 15;
const LISTINGS_LIMIT = 50;

// ✅ grade 표준화 (rare -> RARE, SUPER_RARE -> SUPER RARE)
function normalizeGrade(v) {
  const g = String(v ?? '').toUpperCase();
  if (g === 'SUPER_RARE') return 'SUPER RARE';
  return g || 'COMMON';
}

export default function MyGallerySellingPage() {
  const router = useRouter();
  const bp = useBreakpoint();
  const isMobile = bp === 'sm';

  const { setOwnedCount, setTitle } = useMyGalleryCount();

  // ✅ filters
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('ALL');
  const [genre, setGenre] = useState('ALL');
  const [sellMethod, setSellMethod] = useState('ALL'); // ALL | SELL | TRADE
  const [soldOut, setSoldOut] = useState('ALL'); // ALL | SOLD_OUT | ON_SALE

  // ✅ pagination
  const [page, setPage] = useState(1);

  // ✅ data
  const [listings, setListings] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * ✅ Listing 응답 → CardOriginal props 로 변환
   */
  const listingToCard = useCallback(
    (item) => {
      const pc = item?.photoCard ?? {};

      const listingId = item?.listingId ?? item?.listing_id ?? item?.id;
      const sellerUserId = item?.sellerUserId ?? item?.seller_user_id;
      const sellerNickname = item?.sellerNickname ?? item?.seller_nickname;

      const saleType = item?.saleType ?? item?.sale_type ?? 'SELL'; // SELL | TRADE
      const status = item?.status ?? null; // ACTIVE | SOLD_OUT | ...

      const quantity = Number(item?.quantity ?? 0);
      const pricePerUnit = Number(item?.pricePerUnit ?? item?.price_per_unit ?? 0);

      const g = normalizeGrade(pc?.grade ?? pc?.rarity);
      const category = pc?.genre ?? pc?.category ?? 'ALL';

      const title = pc?.name ?? pc?.title ?? pc?.description ?? '';
      const imageSrc =
        normalizeImageUrl(pc?.imageUrl ?? pc?.image_url ?? pc?.image) ||
        '/assets/products/photo-card.svg';

      return {
        id: listingId,
        rarity: g,
        category,
        owner: sellerNickname ?? String(sellerUserId ?? ''),
        description: title,
        price: `${pricePerUnit} P`,
        remaining: quantity,
        outof: quantity,
        imageSrc,

        sellMethod: saleType,
        status,
        sellerUserId,
      };
    },
    [],
  );

  // ✅ soldOut → BE status (ALL이면 빈 값으로 상태 필터를 끄고 내 리스팅 전체 조회)
  const statusParam = useMemo(() => {
    if (soldOut === 'SOLD_OUT') return 'SOLD_OUT';
    if (soldOut === 'ON_SALE') return 'ACTIVE';
    return '';
  }, [soldOut]);

  const fetchListings = useCallback(
    async (cursor = null, append = false) => {
      try {
        setLoading(true);
        setError('');

        const qs = new URLSearchParams();
        qs.set('limit', String(LISTINGS_LIMIT));
        qs.set('status', statusParam);
        if (cursor != null) qs.set('cursor', String(cursor));

        const res = await fetch(`${API_BASE}/users/me/listings?${qs.toString()}`, {
          credentials: 'include',
        });

        if (res.status === 401) {
          router.replace(`/auth/login?redirect=${encodeURIComponent('/mygallery/selling-card')}`);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const items = json?.data?.items ?? json?.items ?? [];
        const next = json?.data?.nextCursor ?? json?.nextCursor ?? null;

        const mapped = items.map(listingToCard);

        setListings((prev) => (append ? [...prev, ...mapped] : mapped));
        setNextCursor(next);
      } catch (e) {
        setError(e?.message ?? 'failed to load');
        if (!append) setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, statusParam, listingToCard, router],
  );

  // ✅ 타이틀
  useEffect(() => {
    setTitle?.('나의 판매 포토카드');
  }, [setTitle]);

  useEffect(() => {
    setListings([]);
    setNextCursor(null);
    setPage(1);
    fetchListings(null, false);
  }, [statusParam, fetchListings]);

  // ✅ FE 필터
  const filteredCards = useMemo(() => {
    return listings.filter((c) => {
      const hay = `${c.description ?? ''} ${c.owner ?? ''} ${c.category ?? ''}`.toLowerCase();
      const okSearch = search ? hay.includes(search.toLowerCase()) : true;

      const okGrade = grade === 'ALL' ? true : c.rarity === grade;
      const okGenre = genre === 'ALL' ? true : c.category === genre;

      const method = c.sellMethod ?? 'SELL';
      const okSellMethod = sellMethod === 'ALL' ? true : method === sellMethod;

      const remaining = Number(c.remaining ?? 0);
      const okSoldOut =
        soldOut === 'ALL' ? true : soldOut === 'SOLD_OUT' ? remaining === 0 : remaining > 0;

      return okSearch && okGrade && okGenre && okSellMethod && okSoldOut;
    });
  }, [listings, search, grade, genre, sellMethod, soldOut]);

  // ✅ chips counts
  const counts = useMemo(() => {
    return {
      common: filteredCards.filter((c) => c.rarity === 'COMMON').length,
      rare: filteredCards.filter((c) => c.rarity === 'RARE').length,
      superRare: filteredCards.filter((c) => c.rarity === 'SUPER RARE').length,
      legendary: filteredCards.filter((c) => c.rarity === 'LEGENDARY').length,
    };
  }, [filteredCards]);

  // ✅ 상단 카운트
  useEffect(() => {
    setOwnedCount(filteredCards.length);
  }, [filteredCards.length, setOwnedCount]);

  // ✅ 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const pagedCards = filteredCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, grade, genre, sellMethod, soldOut]);

  // ✅ 다음 페이지 필요한데 데이터 부족 + cursor 있으면 추가 fetch
  useEffect(() => {
    const need = page * PAGE_SIZE;
    if (filteredCards.length < need && nextCursor && !loading) {
      fetchListings(nextCursor, true);
    }
  }, [page, filteredCards.length, nextCursor, loading, fetchListings]);

  return (
    <div className={styles.listWrapper}>
      {isMobile && <MyGalleryMobileHeader title="판매 포토카드" onBack={() => router.back()} />}

      {!isMobile && <GradeChips counts={counts} />}

      {!isMobile && <div className="mt-[60px] h-px w-full bg-white/20" />}

      <MyGalleryFilterBar
        isMobile={isMobile}
        search={search}
        onChangeSearch={setSearch}
        grade={grade}
        onChangeGrade={setGrade}
        genre={genre}
        onChangeGenre={setGenre}
        showExtraFilters
        sellMethod={sellMethod}
        onChangeSellMethod={setSellMethod}
        soldOut={soldOut}
        onChangeSoldOut={setSoldOut}
      />

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && <div className="mt-6 text-sm text-white/60">불러오는 중...</div>}

      <div className={styles.cardGrid}>
        {!loading && pagedCards.length === 0 ? (
          <div className="col-span-full mt-10 text-center text-white/60">
            판매 중인 포토카드가 없습니다.
          </div>
        ) : (
          pagedCards.map((card) => <CardOriginal key={card.id} {...card} />)
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
