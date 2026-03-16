import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value?: string; onChange?: (v: string | undefined) => void }) =>
    React.createElement('textarea', {
      'data-testid': 'monaco-editor-mock',
      value,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
    }),
  Editor: ({ value, onChange }: { value?: string; onChange?: (v: string | undefined) => void }) =>
    React.createElement('textarea', {
      'data-testid': 'monaco-editor-mock',
      value,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
    }),
}));

import CodeEditor from './CodeEditor';

describe('CodeEditor', () => {
  it('renders wrapper with data-testid', () => {
    render(<CodeEditor value="" onChange={() => {}} />);
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('calls onChange when editor content changes', () => {
    const onChange = vi.fn();
    render(<CodeEditor value="hello" onChange={onChange} />);
    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'world' } });
    expect(onChange).toHaveBeenCalledWith('world');
  });
});
