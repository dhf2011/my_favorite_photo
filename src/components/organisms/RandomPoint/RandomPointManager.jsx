'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RandomPointSelectModal from './RandomPointSelectModal';
import RandomPointResultModal from './RandomPointResultModal';
import { http } from '@/lib/http/client';
import { useBackendStatus } from '@/components/providers/BackendStatusProvider';
import { requestUserRefresh } from '@/lib/auth/userRefresh';

const COOLDOWN_SECONDS = 60 * 60;
const POLL_MS = 30 * 1000;

function pad2(n) {
  return String(n).padStart(2, '0');
}
function formatRemain(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}시간 ${pad2(m)}분 ${pad2(ss)}초`;
}
function parseDateSafe(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function RandomPointManager() {
  const { isReady } = useBackendStatus();

  const [userId, setUserId] = useState(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

  const [earnedPoint, setEarnedPoint] = useState(0);
  const [remainSeconds, setRemainSeconds] = useState(COOLDOWN_SECONDS);
  const [loadingDraw, setLoadingDraw] = useState(false);

  const lastAutoOpenKeyRef = useRef(null);

  const timeText = useMemo(() => formatRemain(remainSeconds), [remainSeconds]);
  const canDraw = userId != null && remainSeconds <= 0;

  useEffect(() => {
    const t = setInterval(() => {
      setRemainSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const { data } = await http.get('/users/me');
      const id = Number(data?.user?.id);
      if (Number.isInteger(id) && id > 0) {
        setUserId(id);
        return id;
      }
      setUserId(null);
      return null;
    } catch {
      setUserId(null);
      return null;
    }
  }, []);

  const refreshStatus = useCallback(async (authedUserId) => {
    const id = authedUserId ?? userId;
    if (id == null) return;
    try {
      const { data: json } = await http.get('/api/point-box-draws/draw-history', {
        params: { userId: id, limit: 1, offset: 0 },
      });
      if (!json?.ok) throw new Error('status ok:false');

      const raw = json.data;
      const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];

      const last = rows[0];
      if (!last) {
        setRemainSeconds(0);
        return;
      }

      const lastAt = parseDateSafe(last.reg_date ?? last.regDate);
      if (!lastAt) {
        setRemainSeconds(0);
        return;
      }

      const diffSec = Math.floor((Date.now() - lastAt.getTime()) / 1000);
      setRemainSeconds(Math.max(0, COOLDOWN_SECONDS - diffSec));
    } catch {
      // ignore
    }
  }, [userId]);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;

    (async () => {
      const id = await refreshAuth();
      if (cancelled || id == null) return;
      await refreshStatus(id);
    })();

    const t = setInterval(async () => {
      const id = await refreshAuth();
      if (!id) return;
      await refreshStatus(id);
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [isReady, refreshAuth, refreshStatus]);

  useEffect(() => {
    if (!canDraw) return;

    const hourBucket = Math.floor(Date.now() / (COOLDOWN_SECONDS * 1000));
    const key = `${userId}:${hourBucket}`;

    if (lastAutoOpenKeyRef.current === key) return;
    lastAutoOpenKeyRef.current = key;

    setSelectOpen(true);
  }, [canDraw, userId]);

  const draw = useCallback(
    async (boxId) => {
      if (userId == null) return { ok: false, reason: 'UNAUTHENTICATED' };
      setLoadingDraw(true);
      try {
        const { data: json } = await http.post('/api/point-box-draws/draw', { userId, boxId });
        if (!json?.ok) throw new Error('draw ok:false');

        const data = json.data ?? json;
        const earned = Number(data.earnedPoints ?? data.earnedPoint ?? 0) || 0;
        const newBalance = Number(data.newBalance);

        setEarnedPoint(earned);
        setSelectOpen(false);
        setResultOpen(true);

        setRemainSeconds(COOLDOWN_SECONDS);
        requestUserRefresh(Number.isFinite(newBalance) ? { points: newBalance } : {});
        return { ok: true };
      } catch (err) {
        const status = err?.response?.status;
        if (status === 429) {
          await refreshStatus(userId);
          return { ok: false, reason: 'COOLDOWN' };
        }
        return { ok: false, reason: 'ERROR' };
      } finally {
        setLoadingDraw(false);
      }
    },
    [userId, refreshStatus],
  );

  const handleConfirm = useCallback(
    async (selectedBoxId) => {
      if (loadingDraw) return;
      if (!selectedBoxId) return;
      await draw(selectedBoxId);
    },
    [draw, loadingDraw],
  );

  return (
    <>
      <RandomPointSelectModal
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        onConfirm={handleConfirm}
        timeText={timeText}
      />
      <RandomPointResultModal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        earnedPoint={earnedPoint}
        timeText={timeText}
      />
    </>
  );
}
