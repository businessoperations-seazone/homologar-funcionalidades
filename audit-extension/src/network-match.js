function matchesPattern(url, pattern) {
  if (!url || !pattern) return false;
  return url.toLowerCase().includes(pattern.toLowerCase());
}

module.exports = { matchesPattern };
