import Skeleton from '@/components/atoms/Skeleton/Skeleton';
import styles from './CardDetailSkeleton.module.css';

export default function CardDetailSkeleton() {
  return (
    <div className={styles.wrap} aria-busy="true" aria-hidden>
      <Skeleton className={styles.back} />
      <Skeleton className={styles.title} />
      <div className={styles.main}>
        <Skeleton className={styles.image} rounded={false} />
        <div className={styles.panel}>
          <div className={styles.row}>
            <Skeleton className={styles.chip} />
            <Skeleton className={styles.chip} />
          </div>
          <Skeleton className={styles.line} />
          <Skeleton className={styles.lineShort} />
          <Skeleton className={styles.line} />
          <Skeleton className={styles.line} />
          <Skeleton className={styles.button} />
        </div>
      </div>
    </div>
  );
}
