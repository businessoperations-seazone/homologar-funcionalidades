const indicator    = document.getElementById('indicator');
const importBtn    = document.getElementById('importBtn');
const fileInput    = document.getElementById('fileInput');
const homologarBtn = document.getElementById('homologarBtn');
const tabStatus    = document.getElementById('tabStatus');

// ── Carregar estado atual ─────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'GET_KNOWLEDGE' }, (res) => {
  if (res?.data?.meta) {
    const { app_name, generated_at } = res.data.meta;
    indicator.textContent = `${app_name} · ${generated_at}`;
  }
});

// Consultar se a aba atual já está sendo homologada
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]?.id) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_TAB_ENABLED' }, (res) => {
    if (chrome.runtime.lastError) return; // content script não ativo nesta aba
    setHomologarState(res?.enabled === true);
  });
});

function setHomologarState(active) {
  if (active) {
    homologarBtn.textContent = '⏹ Parar homologação';
    homologarBtn.classList.add('active');
    tabStatus.textContent = '● Anotações ativas nesta aba';
  } else {
    homologarBtn.textContent = '▶ Homologar esta aba';
    homologarBtn.classList.remove('active');
    tabStatus.textContent = '○ Inativo nesta aba';
  }
}

// ── Importar JSON ─────────────────────────────────────────────────────
importBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      chrome.runtime.sendMessage({ type: 'SAVE_KNOWLEDGE', data }, () => {
        indicator.textContent = `${data.meta?.app_name || 'App'} · ${data.meta?.generated_at || '?'}`;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'KNOWLEDGE_UPDATED', data });
          }
        });
      });
    } catch {
      indicator.textContent = 'Erro: JSON inválido';
    }
  };
  reader.readAsText(file);
});

// ── Botão Homologar ───────────────────────────────────────────────────
homologarBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    const isActive = homologarBtn.classList.contains('active');
    const enabled  = !isActive;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_ENABLED', enabled }, () => {
      if (chrome.runtime.lastError) return;
      setHomologarState(enabled);
    });
  });
});
