// injected.js — roda no contexto MAIN da página (world: "MAIN")
// Não tem acesso a chrome.* APIs.
// Comunica com o content-script via window.postMessage.

(function () {
  // Monkeypatch fetch
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    window.postMessage({ type: 'AUDIT_NETWORK', url }, '*');
    return originalFetch.apply(this, args);
  };

  // Monkeypatch XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    window.postMessage({ type: 'AUDIT_NETWORK', url: String(url) }, '*');
    return originalOpen.apply(this, [method, url, ...rest]);
  };
})();
