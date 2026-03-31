# homologar-funcionalidades

Ferramentas para auditar apps vibe-coded (Lovable/React+Supabase): uma skill do Claude Code que gera um JSON de auditoria e uma extensão Chrome que sobrepõe anotações visuais no app em produção.

## Setup obrigatório

**Ao abrir este projeto pela primeira vez, verifique se o comando está instalado:**

```bash
ls ~/.claude/commands/agente-funcionalidades.md
```

Se não existir, rode antes de qualquer coisa:

```bash
./setup.sh
```

O script instala o comando via symlink e prepara a pasta `auditorias/`. Depois, siga as instruções impressas para carregar a extensão no Chrome.

## Como usar

```
/agente-funcionalidades https://github.com/org/repo-name
```

A skill clona o repo, analisa estaticamente pages/hooks/components/Edge Functions e salva o resultado em:

```
auditorias/YYYY-MM-DD-repo-name.json
```

Importe esse arquivo na extensão Chrome pelo popup (botão "Carregar JSON").

## Estrutura

```
audit-extension/   # extensão Chrome (carregar no Chrome como unpacked)
skills/
  agente-funcionalidades.md   # slash command do Claude Code
auditorias/        # JSONs gerados pelas auditorias (versionados)
setup.sh           # instala comando via symlink + prepara ambiente
```

## Regras

- `auditorias/` é versionado — commite os JSONs gerados para manter histórico
- Nunca commite `audit-extension/node_modules/`
- A skill faz análise 100% estática — nunca executa código do repo auditado
