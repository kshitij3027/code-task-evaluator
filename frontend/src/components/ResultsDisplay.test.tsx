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

import ResultsDisplay from './ResultsDisplay';
import type { TestCaseResult, SubmissionSummary } from '../types';

const sampleResults: TestCaseResult[] = [
  { test_case_index: 0, passed: true, expected_output: '3', actual_output: '3', execution_time_ms: 12, status: 'PASS', error_message: null },
  { test_case_index: 1, passed: false, expected_output: '5', actual_output: '4', execution_time_ms: 8, status: 'WRONG_ANSWER', error_message: null },
  { test_case_index: 2, passed: false, expected_output: '10', actual_output: '', execution_time_ms: 15, status: 'RUNTIME_ERROR', error_message: 'ValueError: invalid literal' },
];

const sampleSummary: SubmissionSummary = { passed: 1, failed: 2, total: 3 };

describe('ResultsDisplay', () => {
  it('renders summary bar with correct counts', () => {
    render(<ResultsDisplay results={sampleResults} summary={sampleSummary} />);
    expect(screen.getByText('Passed 1/3 test cases')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<ResultsDisplay results={sampleResults} summary={sampleSummary} />);
    expect(screen.getByText('Pass')).toBeInTheDocument();
    expect(screen.getByText('Wrong Answer')).toBeInTheDocument();
    expect(screen.getByText('Runtime Error')).toBeInTheDocument();
  });

  it('shows error message for runtime errors', () => {
    render(<ResultsDisplay results={sampleResults} summary={sampleSummary} />);
    expect(screen.getByText('ValueError: invalid literal')).toBeInTheDocument();
  });

  it('shows execution times', () => {
    render(<ResultsDisplay results={sampleResults} summary={sampleSummary} />);
    expect(screen.getByText('12ms')).toBeInTheDocument();
    expect(screen.getByText('8ms')).toBeInTheDocument();
  });

  it('shows diff view for WRONG_ANSWER results', () => {
    render(<ResultsDisplay results={sampleResults} summary={sampleSummary} />);
    expect(screen.getByTestId('monaco-diff-mock')).toBeInTheDocument();
    expect(screen.getByTestId('diff-expected')).toHaveTextContent('5');
    expect(screen.getByTestId('diff-actual')).toHaveTextContent('4');
  });

  it('does not show diff for PASS results', () => {
    const passOnly: TestCaseResult[] = [
      { test_case_index: 0, passed: true, expected_output: '3', actual_output: '3', execution_time_ms: 12, status: 'PASS', error_message: null },
    ];
    render(<ResultsDisplay results={passOnly} summary={{ passed: 1, failed: 0, total: 1 }} />);
    expect(screen.queryByTestId('monaco-diff-mock')).not.toBeInTheDocument();
  });
});
