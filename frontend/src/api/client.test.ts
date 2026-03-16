import { describe, it, expect, vi, beforeEach } from 'vitest';
import { putJSON, deleteJSON } from './client';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('putJSON', () => {
  it('sends PUT with JSON body and returns data', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '1', title: 'Updated' }),
    } as Response);

    const result = await putJSON<{ id: string; title: string }>('/api/tasks/1', { title: 'Updated' });
    expect(result.data.title).toBe('Updated');
    expect(result.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith('/api/tasks/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
  });

  it('throws on error response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    } as Response);

    await expect(putJSON('/api/tasks/bad', {})).rejects.toThrow('Not Found');
  });
});

describe('deleteJSON', () => {
  it('sends DELETE and returns status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    const result = await deleteJSON('/api/tasks/1');
    expect(result.status).toBe(204);
    expect(global.fetch).toHaveBeenCalledWith('/api/tasks/1', { method: 'DELETE' });
  });

  it('throws on error response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    } as Response);

    await expect(deleteJSON('/api/tasks/bad')).rejects.toThrow('Not Found');
  });
});
