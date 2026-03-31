// background.js — service worker MV3
// Responsabilidade: persistir o audit-knowledge.json e
// responder requisições do content script e popup.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_KNOWLEDGE') {
    chrome.storage.local.set({ auditKnowledge: message.data }, () => {
      sendResponse({ ok: true });
    });
    return true; // mantém canal aberto para resposta assíncrona
  }

  if (message.type === 'GET_KNOWLEDGE') {
    chrome.storage.local.get('auditKnowledge', (result) => {
      sendResponse({ data: result.auditKnowledge || null });
    });
    return true;
  }

  if (message.type === 'GET_ENABLED') {
    chrome.storage.local.get('auditEnabled', (result) => {
      sendResponse({ enabled: result.auditEnabled !== false }); // default: true
    });
    return true;
  }

  if (message.type === 'SET_ENABLED') {
    chrome.storage.local.set({ auditEnabled: message.enabled }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
