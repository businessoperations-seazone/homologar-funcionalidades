#!/bin/bash

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_SRC="$REPO_DIR/skills/agente-funcionalidades.md"
SKILL_DST="$HOME/.claude/commands/agente-funcionalidades.md"
echo "=== Setup: homologar-funcionalidades ==="

# 1. Slash command
if [ -L "$SKILL_DST" ]; then
  echo "✓ Comando já instalado (symlink existente)"
elif [ -f "$SKILL_DST" ]; then
  echo "⚠ Já existe um arquivo em $SKILL_DST (não é symlink). Remova manualmente e rode setup novamente."
  exit 1
else
  ln -s "$SKILL_SRC" "$SKILL_DST"
  echo "✓ Comando instalado: $SKILL_DST → $SKILL_SRC"
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
