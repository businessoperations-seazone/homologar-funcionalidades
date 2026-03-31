const { ClickQueue } = require('../src/click-queue');

describe('ClickQueue', () => {
  let queue;
  const el1 = { id: 'btn1' };
  const el2 = { id: 'btn2' };

  beforeEach(() => {
    queue = new ClickQueue({ windowMs: 2000, expiryMs: 3000 });
  });

  test('consome o click mais antigo nao consumido dentro da janela', () => {
    const now = Date.now();
    queue.addClick(el1, now - 1500);  // 1.5s atrás — dentro da janela
    const consumed = queue.consume(now);
    expect(consumed).toBe(el1);
  });

  test('retorna null se nenhum click dentro da janela', () => {
    const now = Date.now();
    queue.addClick(el1, now - 3000);  // 3s atrás — fora da janela de 2s
    const consumed = queue.consume(now);
    expect(consumed).toBeNull();
  });

  test('FIFO: dois clicks dentro da janela — consume o mais antigo primeiro', () => {
    const now = Date.now();
    queue.addClick(el1, now - 1800);  // mais antigo
    queue.addClick(el2, now - 500);   // mais recente
    expect(queue.consume(now)).toBe(el1);
    expect(queue.consume(now)).toBe(el2);
  });

  test('nao consome o mesmo click duas vezes', () => {
    const now = Date.now();
    queue.addClick(el1, now - 1000);
    queue.consume(now);
    expect(queue.consume(now)).toBeNull();
  });

  test('remove clicks expirados após expiryMs', () => {
    const now = Date.now();
    queue.addClick(el1, now - 4000);  // expirado (> 3s)
    queue.cleanup(now);
    expect(queue.consume(now)).toBeNull();
  });
});
