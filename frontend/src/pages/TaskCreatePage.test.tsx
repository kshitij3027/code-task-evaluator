import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskCreatePage from './TaskCreatePage';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('TaskCreatePage', () => {
  it('renders all form fields', () => {
    render(<MemoryRouter><TaskCreatePage /></MemoryRouter>);
    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Problem statement...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Python solution...')).toBeInTheDocument();
    expect(screen.getByText('Create Task', { selector: 'button' })).toBeInTheDocument();
  });

  it('renders initial test case fields', () => {
    render(<MemoryRouter><TaskCreatePage /></MemoryRouter>);
    expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('stdin input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Expected stdout')).toBeInTheDocument();
  });

  it('adds a test case when clicking Add Test Case', () => {
    render(<MemoryRouter><TaskCreatePage /></MemoryRouter>);
    fireEvent.click(screen.getByText('Add Test Case'));
    expect(screen.getByText('Test Case 2')).toBeInTheDocument();
  });

  it('removes a test case but keeps at least one', () => {
    render(<MemoryRouter><TaskCreatePage /></MemoryRouter>);
    // Initially 1 test case, no Remove button
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    // Add a second test case
    fireEvent.click(screen.getByText('Add Test Case'));
    const removeBtns = screen.getAllByText('Remove');
    expect(removeBtns.length).toBe(2);
    // Remove one
    fireEvent.click(removeBtns[0]);
    expect(screen.queryByText('Test Case 2')).not.toBeInTheDocument();
  });

  it('has required attributes on form fields', () => {
    render(<MemoryRouter><TaskCreatePage /></MemoryRouter>);
    expect(screen.getByPlaceholderText('Task title')).toBeRequired();
    expect(screen.getByPlaceholderText('Problem statement...')).toBeRequired();
    expect(screen.getByPlaceholderText('Python solution...')).toBeRequired();
  });
});
