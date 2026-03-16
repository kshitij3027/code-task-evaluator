import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
