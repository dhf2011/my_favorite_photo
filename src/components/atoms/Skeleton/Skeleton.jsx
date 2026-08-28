import styles from './Skeleton.module.css';

export default function Skeleton({ className = '', style, rounded = true }) {
  return (
    <span
      className={`${styles.bone} ${rounded ? styles.rounded : ''} ${className}`.trim()}
      style={style}
      aria-hidden
    />
  );
}
