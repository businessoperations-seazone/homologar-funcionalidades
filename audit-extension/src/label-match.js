function textContainsLabel(text, label) {
  if (!text || !label) return false;
  return text.trim().toLowerCase().includes(label.trim().toLowerCase());
}

module.exports = { textContainsLabel };
