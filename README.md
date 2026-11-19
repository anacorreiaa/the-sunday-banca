# The Sunday · A banca

A banca de revistas da [The Sunday Magazine](https://thesundaymagazine.substack.com): cada edição do Substack vira uma revista numa prateleira de madeira, com filtros por tema, ordenação "Mais recentes / Mais populares", prévia de cada edição e um formulário de sugestões que cai direto num banco privado do Notion.

Construído a partir do [Substack Newsstand Build Guide](https://github.com/annanoellerinke/substack-newsstand-guide) e do Guia Visual v3 da The Sunday.

- **Stack:** Next.js (App Router), React, TypeScript, CSS próprio. Hospedagem: Vercel.
- **Conteúdo:** títulos, datas, tags, links e capas vêm do próprio Substack. O site não guarda o texto das edições.
- **Sem IA em produção** e sem chave de API de IA.

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes de paginação, ordenação, prateleiras e capas
npm run build
```

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Nome | Para quê |
| --- | --- |
| `NOTION_API_TOKEN` | Token da integração do Notion (secreto) |
| `NOTION_DATA_SOURCE_ID` | ID da fonte de dados "Sugestões" no Notion |
| `SITE_URL` | Endereço público do site, ex. `https://the-sunday-banca.vercel.app` |
| `RATE_LIMIT_SECRET` | Opcional. Texto aleatório para o limite de 5 envios por hora |
| `LAUNCH_READY` | `true` libera o Google para indexar o site |
| `RESEND_API_KEY` | Opcional. Chave do Resend (resend.com) para receber cada post-it por e-mail |
| `NOTIFY_EMAIL` | Opcional. E-mail que recebe os post-its (pode ter mais de um, separados por vírgula) |
| `NOTIFY_FROM` | Opcional. Remetente com domínio verificado no Resend; sem ele, o envio só vai para o e-mail da conta Resend |

Sem `NOTION_API_TOKEN` e `NOTION_DATA_SOURCE_ID` o formulário aparece desativado com "As sugestões ainda não estão abertas". Depois de mudar variáveis, faça **Redeploy**.

A manutenção está em [MAINTENANCE.md](MAINTENANCE.md).
