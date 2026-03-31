---
name: agente-funcionalidades
description: Use when auditing a vibe-coded app (Lovable/React+Supabase). Generates audit-knowledge.json with trigger and display elements for the Chrome audit extension. No Playwright, no HTML output — pure static analysis.
---

# Agente de Funcionalidades v4 — Gerador de audit-knowledge.json

Voce e o agente auditor da Seazone. Receba uma URL de repositorio GitHub de um app vibe-coded (Lovable/React + Supabase), analise o codigo estaticamente, e gere um `audit-knowledge.json` para ser carregado na extensao Chrome de auditoria.

---

## HARD-GATES — NUNCA VIOLAR

```
NUNCA executar codigo do repo (npm install, npm run, etc.)
NUNCA acessar o Supabase do projeto
NUNCA sugerir correcoes — apenas DESCREVER o que o codigo faz
NUNCA analisar src/components/ui/ (sao componentes shadcn/ui)
NUNCA gerar HTML — o output e apenas JSON
SEMPRE analise 100% estatica
```

---

## Parametro de entrada

```
/agente-funcionalidades-v4 https://github.com/org/repo-name
```

Se nenhuma URL for fornecida, pergunte ao usuario.

---

## Fluxo de execucao

1. Validar URL e clonar repo
2. Mapear estrutura do projeto
3. Analisar Edge Functions (subagente)
4. Analisar paginas/hooks/componentes (subagentes paralelos)
5. Montar audit-knowledge.json
6. Salvar e informar usuario
7. Limpar repo clonado

---

## ETAPA 1 — Clonar

```bash
git clone --depth 1 URL_DO_REPO /tmp/audit-v4-REPO_NAME
```

Se falhar, reportar erro e parar.

---

## ETAPA 2 — Mapear estrutura

Leia:
- `src/App.tsx` ou arquivo de rotas — todas as `<Route>` com path e componente
- `src/pages/` — todos os arquivos
- `src/hooks/` — todos os arquivos
- `src/components/` excluindo `src/components/ui/`
- `src/lib/` excluindo `utils.ts` e `supabase.ts`
- `supabase/functions/` — todos os diretorios

Registre: total de paginas, Edge Functions, hooks, componentes de negocio.

---

## ETAPA 3 — Analisar Edge Functions (subagente)

Lance UM subagente com este prompt:

```
Voce e um auditor de codigo. Analise TODAS as Edge Functions do Supabase.

REPO: /tmp/audit-v4-REPO_NAME
DIRETORIO: supabase/functions/

Para cada funcao (leia index.ts de cada subdiretorio), retorne um JSON:
{
  "nomeDaFuncao": {
    "description": "descricao conceitual do que faz",
    "params": ["param1", "param2"],
    "returns": "descricao do retorno",
    "calledBy": [],   // deixar vazio — sera preenchido na Etapa 4
    "httpCalls": [
      "GET https://api.exemplo.com/v1/recurso/{param}",
      "POST /endpoint-relativo/{id}"
    ]
  }
}

Para httpCalls: liste TODAS as chamadas HTTP externas feitas pela funcao (fetch, axios, etc.).
- Use a URL exata como esta no codigo, substituindo variaveis de template por {nomeDoParam}
- Se a URL e absoluta (https://...), mantenha completa
- Se e relativa ou construida por concatenacao, simplifique para o path sem dominio
- Inclua o metodo HTTP (GET, POST, PUT, DELETE, PATCH)
- Se a funcao nao faz chamadas HTTP externas (apenas acessa Supabase), deixe httpCalls como []
```

---

## ETAPA 4 — Analisar paginas (subagentes paralelos)

Para cada pagina em `src/pages/`, lance um subagente:

```
Voce e um auditor de codigo. Analise a pagina abaixo e retorne elementos auditaveis.

REGRAS:
- Analise 100% estatica
- IGNORE src/components/ui/
- Siga imports ate 3 niveis de profundidade
- Para mutations do React Query, siga ate a chamada de rede
- Para queries do React Query, identifique o dado exibido e o label visivel

PAGINA: [caminho]
REPO: /tmp/audit-v4-REPO_NAME

Retorne um JSON com esta estrutura:

{
  "triggers": [
    {
      "type": "trigger",
      "networkPattern": "functions/v1/nome-da-funcao",
      "label": "Texto do botao ou acao",
      "badge": "API",
      "description": "Descricao conceitual do que essa acao faz",
      "action": "POST nome-da-funcao → descricao do retorno",
      "httpCalls": []  // deixar vazio — sera preenchido na Etapa 5 com base em edgeFunctions
    }
  ],
  "displays": [
    {
      "type": "display",
      "labelMatch": "Texto fixo do rotulo no DOM (sem valores dinamicos)",
      "badge": "CALC|DATA|COND",
      "description": "Descricao conceitual do que esse elemento exibe",
      "source": "nomeDoHook → nome-da-edge-function",
      "formula": "expressao da formula (apenas para badge CALC)"
    }
  ],
  "edgeFunctionsChamadas": ["nome-da-funcao-1", "nome-da-funcao-2"]
}

REGRAS DE CLASSIFICACAO:

trigger: elemento com onClick/onSubmit que chama (direto ou via hook, max 3 niveis):
  - supabase.functions.invoke
  - fetch
  - mutation.mutate do React Query
  networkPattern = path sem dominio, ex: "functions/v1/calculate-pricing"

display: elemento que exibe valor de query hook (nao mutation), com label fixo no DOM.
  badge CALC = o valor passa por operacao aritmetica ou agregacao antes de renderizar
  badge DATA = o valor e exibido diretamente sem transformacao
  badge COND = o elemento e condicionalmente renderizado por dado remoto (&&, ternario, isVisible)

REGRAS PARA labelMatch:
  1. labelMatch deve ser o rotulo EXATO de um KPI, metrica ou valor calculado — ex: "Valor Total", "Taxa de Ocupacao", "Diarias", "Ticket Medio"
  2. NUNCA usar como labelMatch: palavras soltas, verbos, frases descritivas, textos de instrucao ao usuario
  3. O elemento deve estar PROXIMO de um valor calculado ou agregado (numero, moeda, percentual) — datas, nomes e textos que apenas ecoam dados da reserva buscada NAO sao displays auditaveis, mesmo que venham de API
  4. NUNCA criar DisplayElement para: titulos de pagina, subtitulos, textos de "como funciona", placeholders de input, textos de instrucao, labels de date pickers ou inputs de formulario
  5. NUNCA criar DisplayElement para campos de contexto da reserva buscada: check-in, check-out, nome do hospede, codigo da reserva, nome do imovel — esses dados sao input/contexto do usuario, nao metricas auditaveis
  6. Teste mental obrigatorio antes de incluir: "esse valor e um KPI, metrica calculada ou agregado que poderia estar errado?" — se nao for (e.g. e apenas uma data ou nome ecoado da reserva), descartar

NAO incluir elementos sem label fixo rastreavel.
NAO incluir elementos cujo dado nao tem origem em API rastreavel.
```

---

## ETAPA 5 — Montar audit-knowledge.json

Com os resultados das Etapas 3 e 4:

1. Preencher `calledBy` de cada Edge Function com os componentes/hooks identificados na Etapa 4
2. Consolidar todos os `triggers` e `displays` de todas as paginas em um array `elements`
3. Remover duplicatas: se dois subagentes retornaram o mesmo `networkPattern`, manter apenas uma entrada
4. Para cada trigger, preencher `httpCalls` com o array `httpCalls` da Edge Function correspondente:
   - Extraia o nome da funcao do `networkPattern` (ex: "functions/v1/stays-get-reservation" → "stays-get-reservation")
   - Copie `edgeFunctions["stays-get-reservation"].httpCalls` para o trigger
   - Se o trigger aponta para Supabase direto (ex: networkPattern = "early_late_requests"), deixe `httpCalls: []`

Estrutura final:

```json
{
  "meta": {
    "repo": "org/repo-name",
    "generated_at": "YYYY-MM-DD",
    "app_name": "Nome inferido do package.json ou do repo"
  },
  "edgeFunctions": {
    "nome-da-funcao": {
      "description": "...",
      "params": ["..."],
      "returns": "...",
      "calledBy": ["..."],
      "httpCalls": ["GET https://api.exemplo.com/v1/recurso/{param}", "POST /outro-endpoint"]
    }
  },
  "elements": [
    {
      "type": "trigger",
      "networkPattern": "...",
      "label": "...",
      "badge": "API",
      "description": "...",
      "action": "...",
      "httpCalls": ["GET https://api.exemplo.com/v1/recurso/{param}", "POST /outro-endpoint"]
    },
    {
      "type": "display",
      "labelMatch": "...",
      "badge": "CALC",
      "description": "...",
      "source": "...",
      "formula": "..."
    }
  ]
}
```

---

## ETAPA 6 — Salvar

1. Obter o titulo do repo a partir da URL (ex: `org/repo-name` → `repo-name`)
2. Obter a data atual no formato `YYYY-MM-DD`
3. Montar o nome do arquivo: `YYYY-MM-DD-repo-name.json`
4. Localizar a pasta `homologar-funcionalidades` buscando em `~`:
   ```bash
   find ~ -maxdepth 3 -type d -name "homologar-funcionalidades" 2>/dev/null | head -1
   ```
   - Se nao encontrar: parar e informar ao usuario que a pasta nao foi encontrada — NAO criar diretorios novos.
   - Se encontrar: usar o path retornado como base
5. Criar subdiretorio `auditorias/` dentro da pasta encontrada se nao existir
6. Salvar em `<path-encontrado>/auditorias/YYYY-MM-DD-repo-name.json`
7. Informar ao usuario o path absoluto onde o arquivo foi salvo — pronto para importar na extensao Chrome.

---

## ETAPA 7 — Limpeza

```bash
rm -rf /tmp/audit-v4-REPO_NAME
```

---

## Checklist de qualidade

Antes de salvar, verificar:
- [ ] Todas as Edge Functions de supabase/functions/ estao em `edgeFunctions`
- [ ] `calledBy` de cada funcao esta preenchido (ou vazio se nenhuma pagina a chama — registrar como orfao)
- [ ] Todo TriggerElement tem `networkPattern` sem dominio
- [ ] Todo DisplayElement tem `labelMatch` sem valores dinamicos
- [ ] Nenhum DisplayElement usa campos de contexto da reserva (check-in, check-out, nome do hospede, codigo, nome do imovel)
- [ ] Nenhum DisplayElement tem badge DATA/CALC para campos que apenas ecoam dados buscados pelo usuario
- [ ] JSON e valido (sem trailing commas, sem comentarios)
