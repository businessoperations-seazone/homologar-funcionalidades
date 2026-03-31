class ClickQueue {
  constructor({ windowMs = 2000, expiryMs = 3000 } = {}) {
    this.windowMs = windowMs;
    this.expiryMs = expiryMs;
    this.queue = []; // [{ element, timestamp, consumed }]
  }

  addClick(element, timestamp = Date.now()) {
    this.queue.push({ element, timestamp, consumed: false });
  }

  // Retorna o elemento do primeiro click não-consumido dentro da janela
  consume(now = Date.now()) {
    const minTime = now - this.windowMs;
    for (const entry of this.queue) {
      if (!entry.consumed && entry.timestamp >= minTime) {
        entry.consumed = true;
        return entry.element;
      }
    }
    return null;
  }

  // Remove entradas expiradas ou consumidas
  cleanup(now = Date.now()) {
    const minTime = now - this.expiryMs;
    this.queue = this.queue.filter(
      e => !e.consumed && e.timestamp >= minTime
    );
  }
}

module.exports = { ClickQueue };
