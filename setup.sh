#!/bin/bash

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_SRC="$REPO_DIR/skills/agente-funcionalidades"
SKILL_DST="$HOME/.claude/skills/agente-funcionalidades"
echo "=== Setup: homologar-funcionalidades ==="

# 1. Skill
if [ -L "$SKILL_DST" ]; then
  echo "✓ Skill já instalada (symlink existente)"
elif [ -d "$SKILL_DST" ]; then
  echo "⚠ Já existe uma pasta em $SKILL_DST (não é symlink). Remova manualmente e rode setup novamente."
  exit 1
else
  ln -s "$SKILL_SRC" "$SKILL_DST"
  echo "✓ Skill instalada: $SKILL_DST → $SKILL_SRC"
fi

# 2. Instrução extensão Chrome
echo ""
echo "=== Extensão Chrome ==="
echo "1. Abra chrome://extensions"
echo "2. Ative 'Modo do desenvolvedor'"
echo "3. Clique em 'Carregar sem compactação'"
echo "4. Selecione: $REPO_DIR/audit-extension"
echo ""
echo "Setup concluído. Use: /agente-funcionalidades https://github.com/org/repo"
