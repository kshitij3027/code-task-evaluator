import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Task saved" onDismiss={() => {}} />);
    expect(screen.getByTestId('toast')).toHaveTextContent('Task saved');
  });

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="Done" duration={1000} onDismiss={onDismiss} />);

    expect(screen.getByTestId('toast')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
