import Editor, { type OnMount } from '@monaco-editor/react';
import styles from './CodeEditor.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  height?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ value, onChange, onSubmit, height = '300px', readOnly = false }: Props) {
  const handleMount: OnMount = (editor, monaco) => {
    if (onSubmit) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onSubmit);
    }
  };

  return (
    <div className={styles.wrapper} data-testid="code-editor">
      <Editor
        height={height}
        language="python"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          tabSize: 4,
          lineNumbers: 'on',
          wordWrap: 'off',
          readOnly,
          scrollBeyondLastLine: false,
          fontSize: 14,
        }}
      />
    </div>
  );
}
