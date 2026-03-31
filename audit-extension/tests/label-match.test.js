const { textContainsLabel } = require('../src/label-match');

describe('textContainsLabel', () => {
  test('match exato', () => {
    expect(textContainsLabel('Receita Total', 'Receita Total')).toBe(true);
  });

  test('match parcial — label contido no texto', () => {
    expect(textContainsLabel('Receita Total: R$ 45.230', 'Receita Total')).toBe(true);
  });

  test('case-insensitive', () => {
    expect(textContainsLabel('receita total', 'Receita Total')).toBe(true);
  });

  test('trim de whitespace', () => {
    expect(textContainsLabel('  Receita Total  ', 'Receita Total')).toBe(true);
  });

  test('sem match quando label nao esta no texto', () => {
    expect(textContainsLabel('Custo Operacional', 'Receita Total')).toBe(false);
  });

  test('retorna false para texto vazio', () => {
    expect(textContainsLabel('', 'Receita Total')).toBe(false);
  });

  test('retorna false para label vazio', () => {
    expect(textContainsLabel('Receita Total', '')).toBe(false);
  });
});
