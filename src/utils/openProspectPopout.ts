import type { Contact, PipelineStage } from '../store/useCrmStore';

export function openProspectPopout(contact: Contact, stage?: PipelineStage) {
  const width = 320;
  const height = 380;
  const left = 20;
  const top = window.screen.height - height - 80;

  // Close any existing prospect popout
  const existingKey = 'prospect-popout';
  const existing = (window as Record<string, unknown>)[existingKey] as Window | undefined;
  if (existing && !existing.closed) {
    existing.close();
  }

  const popup = window.open(
    '',
    'prospect-popout',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
  );

  if (!popup) {
    alert('Le navigateur a bloqué la fenêtre pop-up. Autorisez les pop-ups pour ce site.');
    return;
  }

  (window as Record<string, unknown>)[existingKey] = popup;

  const stageColor = stage?.color || '#6366f1';
  const stageName = stage?.name || '';

  const facebookLink = contact.facebookUrl
    ? `<a href="${escapeHtml(contact.facebookUrl)}" target="_blank" style="color:#1877F2;text-decoration:none;display:flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1877F2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(contact.facebookUrl)}</span>
      </a>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName)} - Prospect</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #e0e0e0;
      padding: 0;
      user-select: text;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
      padding: 14px 16px;
      border-bottom: 2px solid ${stageColor};
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header h1 {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 99px;
      color: #fff;
      background: ${stageColor};
      font-weight: 600;
    }
    .content { padding: 14px 16px; }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      margin-bottom: 6px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      font-size: 13px;
      transition: background 0.15s;
    }
    .row:hover { background: rgba(255,255,255,0.1); }
    .row svg { flex-shrink: 0; opacity: 0.6; }
    .row a { max-width: 220px; }
    .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; padding: 0 2px; }
    .tag {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 99px;
      background: rgba(99,102,241,0.2);
      color: #a5b4fc;
      font-weight: 500;
    }
    .copy-btn {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 11px;
      display: none;
    }
    .row { position: relative; }
    .row:hover .copy-btn { display: block; }
    .copy-btn:hover { background: rgba(255,255,255,0.1); color: #a5b4fc; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName)}</h1>
    <span class="badge">${escapeHtml(stageName)}</span>
  </div>
  <div class="content">
    ${contact.company ? `
    <div class="row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
      <span>${escapeHtml(contact.company)}</span>
    </div>` : ''}
    ${contact.phone ? `
    <div class="row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <a href="tel:${escapeHtml(contact.phone)}" style="color:#22c55e;text-decoration:none;">${escapeHtml(contact.phone)}</a>
      <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(contact.phone)}')">copier</button>
    </div>` : ''}
    ${contact.email ? `
    <div class="row">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      <a href="mailto:${escapeHtml(contact.email)}" style="color:#60a5fa;text-decoration:none;">${escapeHtml(contact.email)}</a>
      <button class="copy-btn" onclick="navigator.clipboard.writeText('${escapeHtml(contact.email)}')">copier</button>
    </div>` : ''}
    ${facebookLink ? `
    <div class="row">
      ${facebookLink}
    </div>` : ''}
    ${contact.tags.length > 0 ? `
    <div class="tags">
      ${contact.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
    </div>` : ''}
  </div>
</body>
</html>`;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
