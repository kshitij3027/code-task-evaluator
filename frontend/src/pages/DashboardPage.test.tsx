import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

const mockStats = {
  total_tasks: 3,
  total_submissions: 10,
  overall_pass_rate: 0.7,
};

const mockDashboard = {
  tasks: [
    {
      task_id: 'task-1',
      title: 'Two Sum',
      difficulty: 'easy',
      total_submissions: 5,
      pass_rate: 0.8,
      failure_mode_breakdown: { PASS: 4, WRONG_ANSWER: 1, RUNTIME_ERROR: 0, TIMEOUT: 0, SYNTAX_ERROR: 0 },
    },
    {
      task_id: 'task-2',
      title: 'FizzBuzz',
      difficulty: 'medium',
      total_submissions: 2,
      pass_rate: 0.33,
      failure_mode_breakdown: { PASS: 1, WRONG_ANSWER: 1, RUNTIME_ERROR: 1, TIMEOUT: 0, SYNTAX_ERROR: 0 },
    },
  ],
};

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/api/dashboard/stats')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDashboard) } as Response);
  });
});

describe('DashboardPage', () => {
  it('renders summary stat labels', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
      expect(screen.getByText('Overall Pass Rate')).toBeInTheDocument();
    });
  });

  it('renders task table with titles', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
      expect(screen.getByText('FizzBuzz')).toBeInTheDocument();
    });
  });

  it('renders difficulty filter dropdown', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    const select = screen.getByLabelText(/filter by difficulty/i);
    expect(select).toBeInTheDocument();
  });

  it('renders failure mode badges for non-zero counts', async () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });
    // Check that non-zero badges are rendered
    const badges = screen.getAllByText(/: \d+/);
    expect(badges.length).toBeGreaterThan(0);
  });
});
