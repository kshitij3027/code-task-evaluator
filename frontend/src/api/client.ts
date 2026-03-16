export async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }
  return res.json();
}

export async function postJSON<T>(path: string, body: unknown): Promise<{ data: T; status: number }> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }
  const data = await res.json();
  return { data, status: res.status };
}

export async function putJSON<T>(path: string, body: unknown): Promise<{ data: T; status: number }> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }
  const data = await res.json();
  return { data, status: res.status };
}

export async function deleteJSON(path: string): Promise<{ status: number }> {
  const res = await fetch(path, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }
  return { status: res.status };
}
