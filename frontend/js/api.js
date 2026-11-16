(function () {
  const TOKEN_KEY = 'aquabill_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const opts = { method, headers };
    if (body !== undefined && body !== null) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(path, opts);
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const msg = (data && data.error && data.error.message) || ('Request failed (' + res.status + ')');
      const code = (data && data.error && data.error.code) || 'HTTP_ERROR';
      const err = new Error(msg);
      err.status = res.status;
      err.code = code;
      throw err;
    }
    return data;
  }

  function formatINR(paise) {
    const n = Number(paise || 0) / 100;
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusBadge(status) {
    const s = String(status || '').toLowerCase();
    let cls = 'badge-muted';
    if (s === 'paid' || s === 'active' || s === 'completed') cls = 'badge-success';
    else if (s === 'unpaid' || s === 'partial' || s === 'maintenance') cls = 'badge-warning';
    else if (s === 'overdue' || s === 'suspended' || s === 'failed') cls = 'badge-danger';
    else if (s === 'cancelled' || s === 'inactive') cls = 'badge-muted';
    return '<span class="badge ' + cls + '">' + esc(status) + '</span>';
  }

  function downloadCSV(filename, headers, rows) {
    const escapeCell = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const lines = [headers.map(escapeCell).join(',')];
    for (const r of rows) {
      lines.push(r.map(escapeCell).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.AquaAPI = {
    getToken,
    setToken,
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    put: (p, b) => request('PUT', p, b),
    del: (p) => request('DELETE', p),
    formatINR,
    esc,
    statusBadge,
    downloadCSV
  };
})();
