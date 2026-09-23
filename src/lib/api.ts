const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function retryFetch(input: RequestInfo, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const res = await fetch(input, init);
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return retryFetch(input, init, retries - 1);
    }
    throw err;
  }
}

function handleAuthRedirect(status: number) {
  if (status === 401) {
    localStorage.removeItem('puma_token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

export const api = {
  getAuthHeaders() {
    const token = localStorage.getItem('puma_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  async get<T>(endpoint: string): Promise<T> {
    const res = await retryFetch(`/api${endpoint}`, { headers: this.getAuthHeaders() });
    handleAuthRedirect(res.status);
    if (!res.ok) throw new Error(`API GET Error: ${res.statusText}`);
    return res.json();
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await retryFetch(`/api${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    handleAuthRedirect(res.status);
    if (!res.ok) throw new Error(`API POST Error: ${res.statusText}`);
    return res.json();
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await retryFetch(`/api${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    handleAuthRedirect(res.status);
    if (!res.ok) throw new Error(`API PUT Error: ${res.statusText}`);
    return res.json();
  },

  async delete(endpoint: string): Promise<void> {
    const res = await retryFetch(`/api${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    handleAuthRedirect(res.status);
    if (!res.ok) throw new Error(`API DELETE Error: ${res.statusText}`);
  }
};
