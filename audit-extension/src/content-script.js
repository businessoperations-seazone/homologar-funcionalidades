// content-script.js — roda no contexto ISOLATED
// Orquestra: injeção do injected.js, fila FIFO, badges, TreeWalker, MutationObserver

(function () {
  // ── Injetar injected.js no contexto MAIN ──────────────────────────────
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('src/injected.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();

  // ── Estado ────────────────────────────────────────────────────────────
  let knowledge = null;   // audit-knowledge.json carregado
  let enabled = false; // desativado por padrão — ativado por "Homologar" no popup
  const WINDOW_MS = 2000;
  const EXPIRY_MS = 3000;
  const DEBOUNCE_MS = 300;
  const clickQueue = [];  // [{ element, timestamp, consumed }]
  let injectedBadges = new WeakSet(); // evita duplicar badges

  // ── Carregar JSON do background ───────────────────────────────────────
  chrome.runtime.sendMessage({ type: 'GET_KNOWLEDGE' }, (res) => {
    knowledge = res?.data || null;
    // enabled permanece false até o usuário clicar "Homologar"
  });

  // ── Escutar mensagens do injected.js (MAIN → ISOLATED via postMessage) ─
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== 'AUDIT_NETWORK') return;
    if (!enabled || !knowledge) return;
    handleNetworkCall(event.data.url);
  });

  // ── Capturar clicks ───────────────────────────────────────────────────
  document.addEventListener('click', (event) => {
    if (!enabled) return;
    cleanupQueue();
    clickQueue.push({ element: event.target, timestamp: Date.now(), consumed: false });
  }, true);

  // ── Correlação click → network ────────────────────────────────────────
  function handleNetworkCall(url) {
    const now = Date.now();
    const minTime = now - WINDOW_MS;
    // FIFO: primeiro click não-consumido dentro da janela
    for (const entry of clickQueue) {
      if (!entry.consumed && entry.timestamp >= minTime) {
        const trigger = findTriggerForUrl(url);
        if (trigger) {
          entry.consumed = true;
          injectBadge(entry.element, trigger);
        }
        return;
      }
    }
  }

  function findTriggerForUrl(url) {
    if (!knowledge?.elements) return null;
    return knowledge.elements.find(
      e => e.type === 'trigger' &&
           url.toLowerCase().includes(e.networkPattern.toLowerCase())
    ) || null;
  }

  // ── Scan de displays e triggers via TreeWalker ────────────────────────
  function runScan() {
    if (!knowledge?.elements) return;
    if (!document.body) return;

    // Todos os elementos escaneáveis: displays (labelMatch) + triggers (label)
    const scannable = knowledge.elements.filter(e =>
      (e.type === 'display' && e.labelMatch) ||
      (e.type === 'trigger' && e.label)
    );
    if (!scannable.length) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => node.parentElement?.closest('[data-audit-injected]')
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text) continue;
      const parent = node.parentElement;
      if (!parent || injectedBadges.has(parent)) continue;

      for (const el of scannable) {
        const matchText = el.type === 'display' ? el.labelMatch : el.label;
        if (text.toLowerCase().includes(matchText.toLowerCase())) {
          injectBadge(parent, el);
          break;
        }
      }
    }
  }

  // ── MutationObserver para re-scan após renders React ─────────────────
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    if (!enabled || !knowledge) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runScan, DEBOUNCE_MS);
  });

  function startObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  startObserver();

  // ── Injetar badge e tooltip ───────────────────────────────────────────
  const BADGE_COLORS = {
    API:  { bg: '#3b82f6', text: '#fff' },
    CALC: { bg: '#f59e0b', text: '#fff' },
    DATA: { bg: '#22c55e', text: '#fff' },
    COND: { bg: '#a855f7', text: '#fff' },
  };

  function injectBadge(element, auditElement) {
    if (injectedBadges.has(element)) return;
    injectedBadges.add(element);

    const color = BADGE_COLORS[auditElement.badge] || BADGE_COLORS.API;

    // Tooltip — ancorado ao body com position:fixed para não depender de parent
    const tooltip = document.createElement('div');
    tooltip.setAttribute('data-audit-injected', 'true');
    tooltip.style.cssText = `
      display: none; position: fixed; z-index: 2147483647;
      background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a;
      border-radius: 6px; padding: 8px 12px; font-size: 12px; line-height: 1.5;
      max-width: 320px; white-space: pre-wrap; font-family: monospace;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4); pointer-events: none;
    `;
    tooltip.textContent = buildTooltipText(auditElement);
    document.body.appendChild(tooltip);

    // Badge — inserido como sibling APÓS o elemento (sem mover o elemento)
    const badge = document.createElement('span');
    badge.setAttribute('data-audit-injected', 'true');
    badge.textContent = auditElement.badge;
    badge.style.cssText = `
      display: inline-block; z-index: 9999; vertical-align: middle;
      background: ${color.bg}; color: ${color.text};
      font-size: 10px; font-weight: bold; padding: 1px 4px; margin-left: 3px;
      border-radius: 3px; font-family: monospace; cursor: default;
    `;
    element.parentNode?.insertBefore(badge, element.nextSibling);

    badge.addEventListener('mouseenter', () => {
      // Exibir fora da tela para medir dimensões reais
      tooltip.style.visibility = 'hidden';
      tooltip.style.display = 'block';

      const r   = badge.getBoundingClientRect();
      const tip = tooltip.getBoundingClientRect();
      const pad = 8;

      let top  = r.bottom + 4;
      let left = r.left;

      // Não ultrapassar borda direita
      if (left + tip.width > window.innerWidth - pad) {
        left = window.innerWidth - tip.width - pad;
      }
      // Não ultrapassar borda inferior — abrir acima do badge
      if (top + tip.height > window.innerHeight - pad) {
        top = r.top - tip.height - 4;
      }
      if (left < pad) left = pad;
      if (top  < pad) top  = pad;

      tooltip.style.top        = top  + 'px';
      tooltip.style.left       = left + 'px';
      tooltip.style.visibility = 'visible';
    });
    badge.addEventListener('mouseleave', () => tooltip.style.display = 'none');
  }

  function buildTooltipText(el) {
    let text = `[${el.badge}] ${el.label || el.labelMatch}\n`;
    text += '─'.repeat(36) + '\n';
    text += el.description + '\n';
    if (el.action) text += '\n→ ' + el.action;
    if (el.source) text += '\nFonte: ' + el.source;
    if (el.formula) text += '\nFórmula: ' + el.formula;
    return text;
  }

  // ── Limpeza da fila ───────────────────────────────────────────────────
  function cleanupQueue() {
    const now = Date.now();
    const minTime = now - EXPIRY_MS;
    for (let i = clickQueue.length - 1; i >= 0; i--) {
      if (clickQueue[i].consumed || clickQueue[i].timestamp < minTime) {
        clickQueue.splice(i, 1);
      }
    }
  }

  // ── Escutar mensagens do popup ────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_TAB_ENABLED') {
      sendResponse({ enabled });
      return;
    }
    if (message.type === 'TOGGLE_ENABLED') {
      enabled = message.enabled;
      if (!enabled) {
        document.querySelectorAll('[data-audit-injected]').forEach(el => el.remove());
        injectedBadges = new WeakSet();
      } else if (knowledge) {
        runScan();
      }
      sendResponse({ ok: true });
    }
    if (message.type === 'KNOWLEDGE_UPDATED') {
      knowledge = message.data;
      if (enabled) runScan();
    }
  });
})();
