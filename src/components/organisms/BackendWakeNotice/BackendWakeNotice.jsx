'use client';

import { useBackendStatus } from '@/components/providers/BackendStatusProvider';

export default function BackendWakeNotice({ className = '' }) {
  const { status } = useBackendStatus();
  if (status !== 'waking' && status !== 'unavailable') return null;

  const text =
    status === 'unavailable'
      ? '서버에 연결하지 못했습니다. 다시 시도하는 중입니다.'
      : '서버가 깨어나는 중입니다. 최대 1분 정도 걸릴 수 있어요.';

  return (
    <p className={`mb-4 text-center text-sm text-white/60 ${className}`.trim()} role="status">
      {text}
    </p>
  );
}
