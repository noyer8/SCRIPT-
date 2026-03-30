const SYNC_CONFIG_KEY = 'noyer-crm-sync-config';

export interface SyncConfig {
  githubToken: string;
  gistId: string | null;
  lastSyncAt: string | null;
}

export function getSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { githubToken: '', gistId: null, lastSyncAt: null };
}

export function saveSyncConfig(config: SyncConfig) {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

interface GistFile {
  content: string;
}

interface GistResponse {
  id: string;
  files: Record<string, GistFile>;
}

async function gistFetch(url: string, token: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }
  return res;
}

export async function pushToGist(token: string, gistId: string | null, data: object): Promise<string> {
  const content = JSON.stringify(data, null, 2);
  const files = { 'crm-data.json': { content } };

  if (gistId) {
    // Update existing gist
    await gistFetch(`https://api.github.com/gists/${gistId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ files }),
    });
    return gistId;
  } else {
    // Create new gist
    const res = await gistFetch('https://api.github.com/gists', token, {
      method: 'POST',
      body: JSON.stringify({
        description: 'ScriptFlow CRM - Sync Data',
        public: false,
        files,
      }),
    });
    const gist: GistResponse = await res.json();
    return gist.id;
  }
}

export async function pullFromGist(token: string, gistId: string): Promise<object> {
  const res = await gistFetch(`https://api.github.com/gists/${gistId}`, token);
  const gist: GistResponse = await res.json();
  const file = gist.files['crm-data.json'];
  if (!file) throw new Error('Fichier crm-data.json introuvable dans le Gist');
  return JSON.parse(file.content);
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function findExistingGist(token: string): Promise<string | null> {
  try {
    const res = await gistFetch('https://api.github.com/gists?per_page=100', token);
    const gists: { id: string; description: string; files: Record<string, unknown> }[] = await res.json();
    const match = gists.find(
      (g) => g.description === 'ScriptFlow CRM - Sync Data' && 'crm-data.json' in g.files
    );
    return match?.id ?? null;
  } catch {
    return null;
  }
}
