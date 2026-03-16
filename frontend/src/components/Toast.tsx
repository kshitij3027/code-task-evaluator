import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

interface Props {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onDismiss: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${type === 'error' ? styles.error : styles.success}`} data-testid="toast">
      {message}
    </div>
  );
}
