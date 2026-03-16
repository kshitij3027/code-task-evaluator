import { DiffEditor } from '@monaco-editor/react';
import styles from './DiffView.module.css';

interface Props {
  expected: string;
  actual: string;
}

export default function DiffView({ expected, actual }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.labels}>
        <span className={styles.label}>Expected</span>
        <span className={styles.label}>Actual</span>
      </div>
      <DiffEditor
        height="150px"
        language="text"
        original={expected}
        modified={actual}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          renderSideBySide: true,
          scrollBeyondLastLine: false,
          fontSize: 13,
        }}
      />
    </div>
  );
}
