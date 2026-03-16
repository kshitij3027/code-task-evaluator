import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: any) =>
    React.createElement('textarea', {
      'data-testid': 'monaco-editor-mock',
      value,
      onChange: (e: any) => onChange?.(e.target.value),
    }),
  DiffEditor: ({ original, modified }: any) =>
    React.createElement('div', { 'data-testid': 'monaco-diff-mock' },
      React.createElement('pre', null, original),
      React.createElement('pre', null, modified),
    ),
}));

import TaskDetailPage from './TaskDetailPage';

const mockTask = {
  id: 'task-1',
  title: 'Two Sum',
  description: 'Add two numbers',
  difficulty: 'easy',
  test_cases: [
    { input: '1 2', expected_output: '3' },
    { input: '0 0', expected_output: '0' },
  ],
  created_at: '2026-01-01',
};

const mockSubmissions = { submissions: [] };

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/submissions')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSubmissions) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTask) } as Response);
  });
});

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={['/tasks/task-1']}>
      <Routes>
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TaskDetailPage', () => {
  it('renders task title and difficulty', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('easy')).toBeInTheDocument();
    });
  });

  it('renders test cases table', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('1 2')).toBeInTheDocument();
      expect(screen.getByText('0 0')).toBeInTheDocument();
    });
  });

  it('renders code editor', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    });
  });

  it('renders submit button', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Solution/i })).toBeInTheDocument();
    });
  });

  it('renders edit, delete, and verify buttons', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Verify Reference Solution/i })).toBeInTheDocument();
    });
  });
});
