import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskListPage from './TaskListPage';

const mockTasks = {
  tasks: [
    { id: '1', title: 'Two Sum', description: 'Add two numbers from stdin', difficulty: 'easy', test_cases: [], created_at: '' },
    { id: '2', title: 'FizzBuzz', description: 'Print FizzBuzz sequence', difficulty: 'medium', test_cases: [], created_at: '' },
  ],
};

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockTasks),
  } as Response);
});

describe('TaskListPage', () => {
  it('renders task cards with titles', async () => {
    render(<MemoryRouter><TaskListPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('FizzBuzz')).toBeInTheDocument();
    });
  });

  it('renders Create Task button', () => {
    render(<MemoryRouter><TaskListPage /></MemoryRouter>);
    expect(screen.getByText('Create Task')).toBeInTheDocument();
  });

  it('renders difficulty badges', async () => {
    render(<MemoryRouter><TaskListPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('easy')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });
  });
});
