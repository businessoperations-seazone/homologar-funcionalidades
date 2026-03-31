const { matchesPattern } = require('../src/network-match');

describe('matchesPattern', () => {
  test('match simples por substring', () => {
    expect(matchesPattern(
      'https://xyz.supabase.co/functions/v1/calculate-pricing?foo=bar',
      'functions/v1/calculate-pricing'
    )).toBe(true);
  });

  test('case-insensitive', () => {
    expect(matchesPattern(
      'https://xyz.supabase.co/functions/v1/Calculate-Pricing',
      'calculate-pricing'
    )).toBe(true);
  });

  test('sem match quando pattern nao esta na URL', () => {
    expect(matchesPattern(
      'https://xyz.supabase.co/functions/v1/other-function',
      'functions/v1/calculate-pricing'
    )).toBe(false);
  });

  test('retorna false para URL vazia', () => {
    expect(matchesPattern('', 'calculate-pricing')).toBe(false);
  });

  test('retorna false para pattern vazio', () => {
    expect(matchesPattern('https://example.com', '')).toBe(false);
  });
});
