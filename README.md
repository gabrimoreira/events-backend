# EventFlow — Backend

Backend da plataforma de venda e emissão de ingressos **EventFlow**, em **microserviços** Node.js, consumido pelo frontend [`events-frontend`](https://github.com/wildneifrank/events-frontend) sem mudanças de contrato.

> Trabalho Prático 1 — Desenvolvimento de Software para Nuvem (UFC). Usa EC2 (ALB + Auto Scaling), RDS, S3, ElastiCache, DynamoDB e SNS/SQS.

**Estado atual: setup inicial.** Toda a infraestrutura de código está pronta e rodando: serviços, gateway, banco com seed, cache, audit log, filas e worker. As rotas do contrato estão registradas e validam a entrada, mas respondem `501 Não implementado.` até cada serviço ser implementado (veja [Roadmap](#roadmap-e-divisão-de-trabalho)).

## Arquitetura

```
                  ALB (:80) ── Auto Scaling Group (1 → 3 instâncias, CPU 70% / 25%)
                   │
   EC2 do ASG (docker compose)
   ┌───────────────────────────────────────────────────────────────┐
   │ gateway (nginx) ── build do frontend + /api/* por path        │
   │   /api/auth/*                          → auth-service    :3001 │
   │   /api/events*                         → catalog-service :3002 │
   │   /api/orders*, /api/me/*, /api/tickets,                       │
   │   /api/admin/*                         → sales-service   :3003 │
   └───────────────────────────────────────────────────────────────┘
        │ RDS (PostgreSQL)   │ ElastiCache (Redis)   │ DynamoDB (audit log)
        │ S3 (banners, PDFs) │ SNS ──► SQS ticket-jobs / image-jobs (+ DLQ)
                                          │
   EC2 do worker ── processing-worker ◄───┘  (PDF + QR code do ingresso, resize do banner)
```

- As APIs rodam juntas em cada instância do ASG, porque a especificação pede **uma** instância inicial escalando até 3. Um ASG por serviço multiplicaria as instâncias.
- O **worker** roda separado. É o desacoplamento via SNS/SQS exigido no requisito 6.
- Há **um banco** (schema Prisma único) e cada serviço escreve só nas suas tabelas (veja `packages/db/prisma/schema.prisma`). Com isso, a compra é **uma transação** que protege contra overselling.

## Stack

| Camada    | Tecnologia                                                      |
| --------- | --------------------------------------------------------------- |
| Runtime   | Node.js 22 + TypeScript 6 (strict, mesmas flags do frontend)    |
| HTTP      | Express 5 (erros assíncronos tratados nativamente)              |
| Validação | zod 4 (mensagens em português)                                  |
| Banco     | PostgreSQL 16 + Prisma 7 (`@prisma/adapter-pg`)                 |
| Cache     | Redis 7 (ioredis)                                               |
| AWS       | AWS SDK v3 — S3, SNS, SQS, DynamoDB                             |
| Auth      | JWT HS256 (jsonwebtoken) + bcryptjs                             |
| Logs      | pino (JSON em produção, legível em desenvolvimento)             |
| Build     | tsup (um bundle por serviço) + Docker multi-stage               |
| Gateway   | nginx                                                           |
| Local     | docker compose + LocalStack (S3, SNS, SQS, DynamoDB)            |
| Infra     | Terraform (AWS Academy Learner Lab)                             |
| Qualidade | ESLint 10 + typescript-eslint, Prettier 3 (configs do frontend) |

## Como executar

Pré-requisitos: Node 22 (`.nvmrc`), Docker e o `events-frontend` clonado **ao lado** deste repositório (o gateway builda o front).

```bash
npm install                 # também gera o Prisma Client
cp .env.example .env
npm run infra:up            # postgres, redis, localstack (+ gateway em :3000)
npm run db:migrate          # aplica as migrations
npm run db:seed             # mesmos dados dos mocks do frontend
npm run dev                 # os 3 serviços + worker, com reload
```

- API pelo gateway: `http://localhost:3000/api` (é o `VITE_API_URL` padrão do frontend).
- Health checks: `http://localhost:3001/health`, `:3002/health`, `:3003/health`.
- Frontend contra o backend: no `events-frontend`, use `VITE_USE_MOCKS=false` e `npm run dev`.

Para rodar tudo em containers, como nas EC2: `docker compose --profile services up -d --build`.

> Porta ocupada? Ajuste `POSTGRES_PORT`, `REDIS_PORT` ou `GATEWAY_PORT` no `.env` (e a porta em `DATABASE_URL`/`REDIS_URL`).

### Contas de demonstração

| Perfil        | E-mail                | Senha      |
| ------------- | --------------------- | ---------- |
| Cliente       | `ana@eventflow.com`   | `demo123`  |
| Administrador | `admin@eventflow.com` | `admin123` |

## Comandos

| Comando              | Descrição                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Todos os serviços em modo watch (`dev:auth`, `dev:catalog`, `dev:sales`, `dev:worker` para um só) |
| `npm run build`      | Checagem de tipos + bundle de cada serviço (`dist/`)                                              |
| `npm run typecheck`  | Apenas TypeScript                                                                                 |
| `npm run lint`       | ESLint (`lint:fix` para corrigir)                                                                 |
| `npm run format`     | Prettier (`format:check` para só verificar)                                                       |
| `npm run db:migrate` | Cria/aplica migrations (`prisma migrate dev`)                                                     |
| `npm run db:seed`    | Recria os dados de demonstração                                                                   |
| `npm run db:reset`   | Apaga o banco, reaplica migrations e seed                                                         |
| `npm run infra:up`   | Sobe a infraestrutura local (`infra:down` para parar)                                             |

## Variáveis de ambiente

Um único `.env` na raiz serve a todos os serviços, ao Prisma e ao docker compose (veja `.env.example`). Cada serviço lê e valida as suas **somente** em `src/config/env.ts`, e para na inicialização se faltar alguma.

| Variável                                      | Uso                                                     |
| --------------------------------------------- | ------------------------------------------------------- |
| `NODE_ENV`, `LOG_LEVEL`                       | Ambiente e nível de log                                 |
| `DATABASE_URL`                                | PostgreSQL (RDS)                                        |
| `REDIS_URL`                                   | Redis (ElastiCache)                                     |
| `AWS_REGION`, `AWS_ENDPOINT_URL`              | Região; endpoint do LocalStack (vazio na AWS)           |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`  | Só local (LocalStack). Na EC2 vale o instance profile   |
| `S3_BUCKET`, `S3_PUBLIC_URL`                  | Bucket de arquivos e URL pública dos banners            |
| `AUDIT_TABLE`, `AUDIT_LOG_READS`              | Tabela DynamoDB do audit log; logar também leituras     |
| `EVENTS_TOPIC_ARN`                            | Tópico SNS onde as APIs publicam                        |
| `TICKET_JOBS_QUEUE`, `IMAGE_JOBS_QUEUE`       | Filas SQS consumidas pelo worker                        |
| `JWT_SECRET`, `JWT_TTL_HOURS`                 | Assinatura e validade do token (mesmo segredo em todos) |
| `CORS_ORIGIN`                                 | Origens liberadas (lista separada por vírgula)          |
| `POSTGRES_PORT`, `REDIS_PORT`, `GATEWAY_PORT` | Portas publicadas pelo docker compose                   |

## Estrutura

```
apps/
├── auth-service/        # cadastro, login, perfil, logout
├── catalog-service/     # eventos, lotes, cidades, banner → S3
├── sales-service/       # compra, pedidos, ingressos, dashboard
│   └── src/
│       ├── main.ts          # sobe o servidor + desligamento gracioso
│       ├── app/             # context (clientes de infra) e createApp (middlewares + rotas)
│       ├── config/env.ts    # acesso tipado às variáveis de ambiente
│       ├── routes/          # *.routes.ts (HTTP → service) e *.schemas.ts (zod)
│       ├── services/        # contracts.ts (interfaces) e *.service.ts (regras de negócio)
│       ├── repositories/    # acesso ao banco (Prisma) e `include`s de cada resposta
│       ├── constants/       # limites, TTLs de cache, prefixos do S3
│       └── utils/mappers.ts # linha do banco → tipo do contrato
├── processing-worker/   # consome SQS: handlers/ticketPdf e handlers/bannerResize
└── gateway/             # nginx (template de rotas) + Dockerfile que builda o frontend
packages/
├── shared/              # @eventflow/shared — importado por subpath:
│   └── src/             #   types (espelho de events-frontend/src/types + mensagens),
│                        #   http (erros, auth JWT, validação, health), aws, audit,
│                        #   cache (cache-aside + denylist), messaging (SNS/SQS), config, utils
└── db/                  # @eventflow/db — schema Prisma, migrations, seed, client
infra/
├── terraform/           # infraestrutura AWS (esqueleto: rede)
└── localstack/          # cria bucket, tabela, tópico, filas e assinaturas localmente
Dockerfile               # imagem de qualquer serviço: --build-arg APP=<serviço>
docker-compose.yml       # ambiente local
```

## Serviços e endpoints

Os caminhos são os de `events-frontend/src/services/api/httpServices.ts`. As respostas seguem os tipos de `@eventflow/shared/types` (listas em `Paginated<T>`), e os erros saem como `{ "message": "...", "code": "..." }`.

| Serviço         | Endpoints                                                                                   | Acesso                       |
| --------------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| auth-service    | `POST /auth/login`, `POST /auth/register`, `GET/PATCH /auth/me`, `POST /auth/logout`        | público / logado             |
| catalog-service | `GET /events`, `GET /events/cities`, `GET /events/:id`                                      | público (admin vê rascunhos) |
|                 | `POST /events`, `PUT/DELETE /events/:id`                                                    | admin                        |
| sales-service   | `POST /orders` (compra), `GET /orders/:id`, `GET /me/tickets?scope=`, `GET /me/tickets/:id` | logado                       |
|                 | `GET /orders`, `GET /tickets`, `GET /admin/dashboard`                                       | admin                        |

Mensagens assíncronas (`@eventflow/shared/types/messages.ts`):

| Mensagem          | Publicada por   | Fila (filter policy)    | Worker faz                                                     |
| ----------------- | --------------- | ----------------------- | -------------------------------------------------------------- |
| `ORDER_PAID`      | sales-service   | `eventflow-ticket-jobs` | gera QR code + PDF, envia ao S3 e muda o ingresso para `valid` |
| `BANNER_UPLOADED` | catalog-service | `eventflow-image-jobs`  | redimensiona o banner (thumb/card/hero) e grava as variantes   |

## Serviços AWS (requisitos do trabalho)

| Requisito                    | Como é atendido                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| 1. Interface web na EC2      | O gateway nginx serve o frontend e as APIs nas instâncias do ASG                         |
| 2. Dados no RDS              | PostgreSQL: usuários, eventos, lotes, pedidos, ingressos (`packages/db`)                 |
| 3. Binários no S3            | Banner dos eventos (`public/banners/`) e PDF dos ingressos (`private/tickets/`)          |
| 4. ElastiCache               | `cache.remember` (vitrine, detalhe, cidades, dashboard) e denylist de tokens             |
| 5. Log de CRUD no NoSQL      | `auditLog` → DynamoDB `eventflow-audit-log`: tipo da ação, dados manipulados e horário   |
| 6. Processamento desacoplado | APIs publicam no SNS → SQS → `processing-worker` (PDF/QR do ingresso, resize do banner)  |
| Parte 2. Elasticidade        | ALB + ASG 1–3 instâncias, escala com CPU > 70% por 1 min e reduz com CPU < 25% por 1 min |

## Padrões do código

Os padrões são os do frontend: as páginas conhecem os `contracts`, e aqui as rotas conhecem os `services/contracts.ts`.

- **Fluxo:** `routes/*.routes.ts` → `parseWith(schema, req.body)` → `services/*.service.ts` → `repositories` → `utils/mappers.ts`.
- **Erros:** lance `new ApiError(mensagem, status, código)`, com a mesma classe e assinatura dos mocks do frontend. As regras de `mockServices.ts` podem ser portadas quase literalmente.
- **Auth:**
  - `requireAuth(auth)`, `requireAdmin` e `optionalAuth(auth)` protegem as rotas.
  - Nos handlers, `currentUser(req)` devolve o usuário.
  - O token é emitido com `signAccessToken` e verificado localmente por todos os serviços.
- **Audit:** `audit.log({ action: 'CREATE', entity: 'EVENT', entityId, actorId, data })` em toda mutação. Nunca derruba a requisição: data URLs são truncadas e senhas redigidas.
- **Cache:** `cache.remember(CACHE_SCOPE.catalog, chave, ttl, loader)` para leituras e `cache.invalidate(CACHE_SCOPE.catalog)` após escritas, inclusive compras.
- **Mensagens:** `publisher.publish({ type: 'ORDER_PAID', … })` depois do commit. Os handlers do worker devem ser **idempotentes**, porque o SQS pode reentregar.
- **IDs:** `createId('evt')` gera `evt_xxxxxxxxxx`, o mesmo formato do frontend. O número do pedido é `EF-<sequência>`.
- **Services dos stubs:** as dependências já chegam em `_deps`. Ao implementar, renomeie para `deps` e troque `notImplemented()` pela regra.

## Roadmap e divisão de trabalho

| Fase           | Datas       | Entregas                                                                                                                    |
| -------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| 0 Setup        | 27–28/09    | este repositório                                                                                                            |
| 1 Core         | 29/09–02/10 | **auth** completo; **catalog** CRUD + cache + banner no S3 + audit; **sales** compra transacional (409) + pedidos/ingressos |
| 2 Assíncrono   | 02–04/10    | **worker** PDF/QR + resize; dashboard; frontend ligado ao backend local                                                     |
| 3 AWS          | 04–06/10    | Terraform completo (RDS, ElastiCache, S3, DynamoDB, SNS/SQS, ECR, ALB, ASG, worker) + deploy                                |
| 4 Elasticidade | 07–09/10    | alarmes de CPU, teste de carga (scale-out 1→3 e scale-in), vídeo, README final                                              |
| Entrega        | 10/10       | links dos repositórios + vídeo                                                                                              |

As frentes são independentes e podem ser divididas por pessoa: **auth**, **catalog**, **sales**, **worker** e **infra** (Terraform + ALB/ASG + teste de carga).

## Integração com o frontend

- `VITE_USE_MOCKS=false` troca os mocks pela API sem mudar as páginas.
- O `apiClient` do frontend monta a URL com `new URL(...)`, então `VITE_API_URL` precisa ser **absoluta**. O gateway recebe essa URL como build arg: `http://localhost:3000/api` localmente e o DNS do ALB na AWS.
- O banner chega como data URL em `bannerUrl`. O catalog-service envia ao S3 e grava a URL pública, sem nenhuma mudança no frontend.
- Ingressos nascem `processing`. O frontend já faz polling (`useProcessingPoll`) até o worker marcar `valid`.
