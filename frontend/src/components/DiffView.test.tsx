import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@monaco-editor/react', () => ({
  DiffEditor: ({ original, modified }: { original?: string; modified?: string }) =>
    React.createElement('div', { 'data-testid': 'monaco-diff-mock' },
      React.createElement('pre', { 'data-testid': 'diff-expected' }, original),
      React.createElement('pre', { 'data-testid': 'diff-actual' }, modified),
    ),
}));

import DiffView from './DiffView';

describe('DiffView', () => {
  it('renders Expected and Actual labels', () => {
    render(<DiffView expected="3" actual="4" />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
  });

  it('shows expected and actual content', () => {
    render(<DiffView expected="hello" actual="world" />);
    expect(screen.getByTestId('diff-expected')).toHaveTextContent('hello');
    expect(screen.getByTestId('diff-actual')).toHaveTextContent('world');
  });
});
