'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '@/components/atoms/Modal/Modal';
import InputSearch from '@/components/molecules/InputSearch/InputSearch';
import DropDown from '@/components/atoms/DropDown/DropDown';
import MyCard from '@/components/organisms/MyCard/MyCard';
import OpenModal from '@/components/organisms/OpenModal/OpenModal';
import MarketplaceSellSuccessPage from '@/app/(main)/marketplace/sell/success/page';
import CardSellingForm from '@/components/organisms/CardSellingForm/CardSellingForm';
import SubHeaderExchange from '@/components/organisms/SubHeader/SubHeaderExchange';
import { http } from '@/lib/http/client';
import { normalizeImageUrl } from '@/utils/imageUrl';
import styles from './CardSellingListModal.module.css';

const STORAGE_SELL_CARD = 'marketplace_sell_card';

/**
 * GET /users/me/cards 응답 항목 (user_card + photo_card)을 MyCard용 카드 객체로 변환
 * id = user_card_id so each row is distinct and we have user_card_id for creating listing
 */
function userCardRowToCard(row) {
  const userCardId = row?.user_card_id ?? row?.userCardId ?? row?.id;
  const photoCardId =
    row?.photo_card_id ?? row?.photoCardId ?? row?.photoCard?.photoCardId ?? row?.photoCard?.photo_card_id;
  const quantity = Number(row?.quantity ?? 0);
  const name = row?.name ?? row?.photoCard?.name;
  return {
    id: userCardId,
    user_card_id: userCardId,
    userCardId,
    photo_card_id: photoCardId,
    photoCardId,
    quantity,
    maxQuantity: quantity,
    initialQuantity: quantity > 0 ? 1 : 0,
    rarity: row?.grade ?? row?.photoCard?.grade ?? 'COMMON',
    category: row?.genre ?? row?.photoCard?.genre ?? '풍경',
    owner: '나',
    description: name ?? row?.description ?? '-',
    price: `${row?.min_price ?? row?.minPrice ?? row?.photoCard?.minPrice ?? 0} P`,
    imageSrc:
      normalizeImageUrl(row?.imageUrl ?? row?.image_url ?? row?.photoCard?.imageUrl) ||
      '/assets/products/photo-card.svg',
    title: name,
    grade: row?.grade ?? row?.photoCard?.grade,
    genre: row?.genre ?? row?.photoCard?.genre,
  };
}

function listingItemIds(item) {
  return {
    userCardId: Number(item?.userCardId ?? item?.user_card_id),
    photoCardId: Number(
      item?.photoCard?.photoCardId ?? item?.photoCard?.photo_card_id ?? item?.photo_card_id,
    ),
  };
}

export default function CardSellingListModal({
  open,
  onClose,
  modalTitle = '나의 포토카드 판매하기',
  onCardSelect,
  onSellCardSelect,
  onSellSuccess,
  mode = 'sell',
  sellerUserId,
}) {
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('all');
  const [genre, setGenre] = useState('all');
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSellSuccessModalOpen, setIsSellSuccessModalOpen] = useState(false);
  const [soldCardData, setSoldCardData] = useState(null);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeCardData, setExchangeCardData] = useState(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1199 : false,
  );
  const [filters, setFilters] = useState({ rarity: 'all', genre: 'all', soldout: 'all' });
  const [showSellForm, setShowSellForm] = useState(false);
  const [sellFormCardData, setSellFormCardData] = useState(null);

  const [sellingList, setSellingList] = useState([]);
  const [sellingListLoading, setSellingListLoading] = useState(false);
  const [sellingListError, setSellingListError] = useState(null);

  // Detect mobile (≤499px) and tablet (500–1199px): use bottom sheet for both
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileOrTablet(window.innerWidth <= 1199);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Reset sell form state when modal closes
  useEffect(() => {
    if (!open) {
      setShowSellForm(false);
      setSellFormCardData(null);
    }
  }, [open]);

  /** 보유 카드 중 이미 판매 중인 카드는 제외 */
  const fetchMyCards = useCallback(async () => {
    setSellingListLoading(true);
    setSellingListError(null);
    try {
      const [cardsRes, listingsRes] = await Promise.all([
        http.get('/users/me/cards'),
        http.get('/users/me/listings?status=ACTIVE&limit=50'),
      ]);
      const data = cardsRes.data?.data ?? [];
      const listingPayload = listingsRes.data?.data;
      const listingItems = Array.isArray(listingPayload)
        ? listingPayload
        : (listingPayload?.items ?? listingsRes.data?.items ?? []);

      const listedUserCardIds = new Set();
      const listedPhotoCardIds = new Set();
      for (const item of listingItems) {
        const { userCardId, photoCardId } = listingItemIds(item);
        if (Number.isFinite(userCardId) && userCardId > 0) listedUserCardIds.add(userCardId);
        if (Number.isFinite(photoCardId) && photoCardId > 0) listedPhotoCardIds.add(photoCardId);
      }

      const available = (Array.isArray(data) ? data.map(userCardRowToCard) : []).filter((card) => {
        const userCardId = Number(card.user_card_id ?? card.userCardId ?? card.id);
        const photoCardId = Number(card.photo_card_id ?? card.photoCardId);
        if (Number.isFinite(userCardId) && listedUserCardIds.has(userCardId)) return false;
        if (Number.isFinite(photoCardId) && listedPhotoCardIds.has(photoCardId)) return false;
        return Number(card.quantity) > 0;
      });

      setSellingList(available);
    } catch (err) {
      const status = err?.response?.status;
      const message =
        status === 401
          ? '로그인이 필요합니다.'
          : (err?.response?.data?.message ?? err?.message ?? '보유 카드를 불러오지 못했습니다.');
      setSellingListError(message);
      setSellingList([]);
    } finally {
      setSellingListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchMyCards();
    if (!open) setSellingList([]);
  }, [open, fetchMyCards]);

  const gradeOptions = [
    { value: 'all', label: '등급' },
    { value: 'COMMON', label: 'COMMON' },
    { value: 'RARE', label: 'RARE' },
    { value: 'SUPER RARE', label: 'SUPER RARE' },
    { value: 'LEGENDARY', label: 'LEGENDARY' },
  ];

  const genreOptions = [
    { value: 'all', label: '장르' },
    { value: '풍경', label: '풍경' },
    { value: '음식', label: '음식' },
    { value: '인물', label: '인물' },
    { value: '동물', label: '동물' },
  ];

  const filteredCards = useMemo(() => {
    let list = sellingList;
    if (grade && grade !== 'all')
      list = list.filter((c) => c.grade === grade || c.rarity === grade);
    if (genre && genre !== 'all')
      list = list.filter((c) => c.genre === genre || c.category === genre);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.description || '').toLowerCase().includes(q) ||
          (c.title || '').toLowerCase().includes(q) ||
          (c.name || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [sellingList, grade, genre, search]);

  const handleCardClick = (card) => {
    if (mode === 'exchange' && onCardSelect) {
      setExchangeCardData(card);
      onCardSelect(card);
      onClose();
    } else if (mode === 'sell') {
      // Desktop: show sell form inside modal
      // Mobile/Tablet: navigate to full page
      if (!isMobileOrTablet) {
        // Desktop: show form in modal
        setSellFormCardData(card);
        setShowSellForm(true);
      } else if (onSellCardSelect) {
        // Mobile/Tablet: navigate to full page
        try {
          sessionStorage.setItem(STORAGE_SELL_CARD, JSON.stringify(card));
        } catch {}
        onClose();
        onSellCardSelect(card);
      } else {
        // Fallback: open OpenModal
        setSelectedCard(card);
        setIsOpenModalOpen(true);
      }
    }
  };

  const handleSellFormBack = () => {
    setShowSellForm(false);
    setSellFormCardData(null);
  };

  const handleSellFormSuccess = (payload) => {
    setShowSellForm(false);
    setSellFormCardData(null);
    if (onSellSuccess) {
      onSellSuccess(payload);
      return;
    }
    setSoldCardData(payload);
    setIsSellSuccessModalOpen(true);
    fetchMyCards();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={isMobileOrTablet ? 'bottomSheetFull' : 'custom'}
      showCloseButton={!isMobileOrTablet && !showSellForm}
    >
      <div className={styles.modalContainer}>
        {/* Desktop: Show sell form or card list */}
        {!isMobileOrTablet && showSellForm && sellFormCardData ? (
          <CardSellingForm
            cardData={sellFormCardData}
            onBack={handleSellFormBack}
            onSuccess={handleSellFormSuccess}
            isInModal={true}
          />
        ) : (
          /* Scrollable content area */
          <div className={styles.scrollableContent}>
            {/* Desktop (≥1200px): Original layout */}
            {!isMobileOrTablet && (
              <>
                {/* "마이갤러리" Subtitle */}
                <div className={styles.subtitleBox}>
                  <h2 className={styles.subtitle}>마이갤러리</h2>
                </div>

                {/* Main Title */}
                <div className={styles.titleBox}>
                  <h1
                    className={styles.mainTitle}
                    style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontWeight: 700,
                      fontStyle: 'normal',
                      fontSize: '40px',
                      lineHeight: '100%',
                      color: '#ffffff',
                      margin: 0,
                      paddingBottom: '20px',
                    }}
                  >
                    {modalTitle}
                  </h1>
                </div>

                {/* Search and Filter Section */}
                <div className={styles.filterSection}>
                  <InputSearch
                    placeholder="검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={() => {}}
                    className={styles.searchInput}
                  />
                  <div className={styles.dropdownWrapper}>
                    <DropDown
                      options={gradeOptions}
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      wrapperStyle={{ border: '0px solid #ffffff' }}
                      style={{ border: '0px solid #ffffff', backgroundColor: '#141414' }}
                    />
                  </div>
                  <div className={styles.dropdownWrapper}>
                    <DropDown
                      options={genreOptions}
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      wrapperStyle={{ border: '0px solid #ffffff' }}
                      style={{ border: '0px solid #ffffff', backgroundColor: '#141414' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Mobile & Tablet: SubHeaderExchange (bottom sheet header) */}
            {isMobileOrTablet && (
              <SubHeaderExchange
                subtitle="마이갤러리"
                title={modalTitle}
                search={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                filters={filters}
                onFiltersChange={setFilters}
                cards={filteredCards}
                onClose={onClose}
              />
            )}

            {/* 보유 카드(user_card) 로딩/에러 */}
            {sellingListLoading && (
              <div className={styles.cardsGrid}>보유 카드를 불러오는 중...</div>
            )}
            {sellingListError && !sellingListLoading && (
              <div className={styles.cardsGrid}>{sellingListError}</div>
            )}

            {/* MyCard Grid */}
            {!sellingListLoading && !sellingListError && (
              <div className={styles.cardsGrid}>
                {filteredCards.length === 0 ? (
                  <div className={styles.emptyState}>판매할 수 있는 포토카드가 없습니다.</div>
                ) : (
                  filteredCards.map((card) => (
                    <div key={card.id} className={styles.cardItem}>
                      <MyCard
                        rarity={card.rarity}
                        category={card.category}
                        owner={card.owner}
                        description={card.description}
                        price={card.price}
                        quantity={card.quantity}
                        imageSrc={card.imageSrc}
                        imageWidth={isMobileOrTablet ? 170 : 400}
                        imageHeight={isMobileOrTablet ? 150 : 400}
                        onClick={() => handleCardClick(card)}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Open Modal for selling */}
      <OpenModal
        open={isOpenModalOpen}
        onClose={() => {
          setIsOpenModalOpen(false);
          setSelectedCard(null);
        }}
        cardData={selectedCard}
        mode="sell"
        onSellSuccess={() => {
          // Close OpenModal and show success modal
          setIsOpenModalOpen(false);
          setSelectedCard(null);
          if (onSellSuccess) {
            onSellSuccess();
            return;
          }
          setIsSellSuccessModalOpen(true);
        }}
      />

      {/* Sell Success Modal */}
      <Modal
        open={isSellSuccessModalOpen}
        onClose={() => {
          setIsSellSuccessModalOpen(false);
          setSoldCardData(null);
        }}
        size="custom"
        noBorder={true}
      >
        <MarketplaceSellSuccessPage
          onButtonClick={() => {
            // Close success modal, keep CardSellingListModal open
            setIsSellSuccessModalOpen(false);
            setSoldCardData(null);
          }}
          cardData={soldCardData}
        />
      </Modal>
    </Modal>
  );
}
