// Lettura e pubblicazione sul repository del sito, direttamente dal browser.

export const REPO = 'lucsal2603/prontostaff';
export const RAMO = 'main';
export const SITO = 'https://lucsal2603.github.io/prontostaff/';
const API = 'https://api.github.com';

export function creaGithub(token) {
  async function chiama(metodo, percorso, corpo) {
    const r = await fetch(`${API}/repos/${REPO}${percorso}`, {
      method: metodo,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(corpo ? { 'Content-Type': 'application/json' } : {})
      },
      body: corpo ? JSON.stringify(corpo) : undefined
    });
    if (!r.ok) {
      const e = new Error(`GitHub ${r.status}`);
      e.stato = r.status;
      throw e;
    }
    return r.status === 204 ? null : r.json();
  }

  return {
    async verifica() {
      const r = await chiama('GET', '');
      return !!(r.permissions && r.permissions.push);
    },

    async leggi(percorso) {
      const r = await fetch(`${API}/repos/${REPO}/contents/${percorso}?ref=${RAMO}`, {
        cache: 'no-store',
        headers: { Accept: 'application/vnd.github.raw', Authorization: `Bearer ${token}` }
      });
      if (!r.ok) {
        const e = new Error(`GitHub ${r.status} leggendo ${percorso}`);
        e.stato = r.status;
        throw e;
      }
      return r.text();
    },

    // file: { percorso: { testo } | { base64 } | null (da cancellare) }
    async pubblica(file, messaggio) {
      const ref = await chiama('GET', `/git/ref/heads/${RAMO}`);
      const padre = ref.object.sha;
      const commitPadre = await chiama('GET', `/git/commits/${padre}`);
      const albero = [];
      for (const [percorso, c] of Object.entries(file)) {
        if (c === null) {
          albero.push({ path: percorso, mode: '100644', type: 'blob', sha: null });
          continue;
        }
        const blob = await chiama(
          'POST',
          '/git/blobs',
          c.base64 != null
            ? { content: c.base64, encoding: 'base64' }
            : { content: c.testo, encoding: 'utf-8' }
        );
        albero.push({ path: percorso, mode: '100644', type: 'blob', sha: blob.sha });
      }
      const nuovo = await chiama('POST', '/git/trees', { base_tree: commitPadre.tree.sha, tree: albero });
      const commit = await chiama('POST', '/git/commits', {
        message: messaggio,
        tree: nuovo.sha,
        parents: [padre],
        author: {
          name: 'ProntoStaff+',
          email: 'gestionale@users.noreply.github.com',
          date: new Date().toISOString()
        }
      });
      await chiama('PATCH', `/git/refs/heads/${RAMO}`, { sha: commit.sha, force: false });
      return commit.sha;
    }
  };
}
