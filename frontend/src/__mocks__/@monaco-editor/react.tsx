import React from 'react';

export function Editor({ value, onChange }: { value?: string; onChange?: (v: string | undefined) => void }) {
  return (
    <textarea
      data-testid="monaco-editor-mock"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

export function DiffEditor({ original, modified }: { original?: string; modified?: string }) {
  return (
    <div data-testid="monaco-diff-mock">
      <pre data-testid="diff-expected">{original}</pre>
      <pre data-testid="diff-actual">{modified}</pre>
    </div>
  );
}

export default Editor;
