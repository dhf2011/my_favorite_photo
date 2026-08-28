import CardOriginalSkeleton from '@/components/organisms/CardOriginal/CardOriginalSkeleton';

export default function CardGridSkeleton({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => <CardOriginalSkeleton key={i} />);
}
