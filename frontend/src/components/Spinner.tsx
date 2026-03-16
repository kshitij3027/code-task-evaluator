import styles from './Spinner.module.css';

export default function Spinner() {
  return (
    <div className={styles.container} data-testid="spinner">
      <div className={styles.spinner} />
    </div>
  );
}
