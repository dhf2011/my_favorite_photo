import Skeleton from '@/components/atoms/Skeleton/Skeleton';
import cardStyles from './CardOriginal.module.css';
import styles from './CardOriginalSkeleton.module.css';

export default function CardOriginalSkeleton() {
  return (
    <div className={cardStyles.cardOriginal} aria-hidden>
      <div className={cardStyles.imageContainer}>
        <Skeleton className={styles.image} rounded={false} />
      </div>
      <div className={cardStyles.content}>
        <Skeleton className={styles.title} />
        <div className={styles.metaRow}>
          <Skeleton className={styles.chip} />
          <Skeleton className={styles.chip} />
          <Skeleton className={styles.owner} />
        </div>
        <div className={cardStyles.divider} />
        <div className={styles.infoRow}>
          <Skeleton className={styles.label} />
          <Skeleton className={styles.value} />
        </div>
        <div className={styles.infoRow}>
          <Skeleton className={styles.label} />
          <Skeleton className={styles.value} />
        </div>
      </div>
    </div>
  );
}
