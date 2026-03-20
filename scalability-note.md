# Scalability Notes

## Current Architecture

The app runs as a single Node.js process backed by a PostgreSQL connection pool (max 20 connections) and an optional Redis instance. This handles moderate load well, but the following changes would be needed as traffic grows.

---

## Horizontal Scaling

Node.js is single-threaded, so the first step is running multiple instances behind a load balancer. With Docker Compose this means scaling the backend service:

```bash
docker compose up --scale backend=4
```

For this to work correctly, session state cannot live in memory — JWT already satisfies this since tokens are stateless. The refresh token is stored in PostgreSQL, so any instance can validate it. The only shared state is the Winston log files, which should be moved to a centralized sink (e.g. Datadog, Loki) in a multi-instance setup.

With Kubernetes, the backend becomes a `Deployment` with a `HorizontalPodAutoscaler` targeting CPU utilization. The Nginx or a cloud load balancer (AWS ALB, GCP Cloud Load Balancing) distributes traffic across pods.

---

## Database

**Connection pooling** — The current `pg.Pool` with `max: 20` works for a single instance. With multiple backend replicas each holding their own pool, the total open connections to Postgres grows linearly. PgBouncer as a connection proxy in front of Postgres solves this — it multiplexes many application connections onto a smaller set of actual server connections.

**Read replicas** — Write traffic (INSERT, UPDATE, DELETE) goes to the primary. Read-heavy endpoints like task listing and stats queries can be routed to read replicas using a separate pool pointed at the replica host.

**Indexing** — The migration already creates indexes on `tasks.user_id`, `tasks.status`, `tasks.created_at`, and `users.email`. As data grows, `EXPLAIN ANALYZE` on the slow query log will identify any missing indexes. Partial indexes (e.g. `WHERE status != 'archived'`) reduce index size for queries that filter active tasks.

**Partitioning** — The `tasks` table can be range-partitioned by `created_at` once it exceeds tens of millions of rows. Older partitions become effectively read-only and can be archived to cheaper storage.

---

## Caching

Redis is already wired into the Docker Compose setup. The two highest-value caching targets are:

**Task stats** — The `/tasks/stats` aggregation query runs a full table scan with `COUNT` filters. This result changes infrequently and can be cached in Redis with a short TTL (30–60 seconds), invalidated on any task write.

**User lookups** — Every authenticated request hits `SELECT ... FROM users WHERE id = $1`. These rows change rarely. Caching the user record in Redis for the token lifetime eliminates the DB round-trip entirely.

Implementation would wrap the controller query with a cache-aside pattern:

```js
const cacheKey = `user:${id}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
const result = await query('SELECT ...', [id]);
await redis.setex(cacheKey, 300, JSON.stringify(result.rows[0]));
return result.rows[0];
```

---

## Asynchronous Processing

Operations like sending email notifications (welcome emails, due date reminders) or generating exports should not block the HTTP response. A job queue (Bull with Redis, or BullMQ) decouples these — the API enqueues the job and returns immediately, workers process it in the background.

---

## Rate Limiting at Scale

The current `express-rate-limit` middleware stores counters in memory, which breaks when running multiple instances (each instance has its own counter). Replacing the store with `rate-limit-redis` makes the counters shared across all replicas:

```js
const RedisStore = require('rate-limit-redis');
rateLimit({ store: new RedisStore({ client: redisClient }), ... });
```

---

## Microservices Path

If the product grows beyond a single team working on a single codebase, the natural split is:

- **Auth service** — handles registration, login, token issuance and validation
- **Task service** — owns the tasks domain, trusts tokens validated by auth
- **Notification service** — consumes events from a message broker (Kafka or RabbitMQ)

Each service gets its own database schema, deploys independently, and communicates over HTTP or gRPC internally. The API gateway (Kong, AWS API Gateway) handles routing, rate limiting, and auth at the edge.

This split is premature for early stage — the current monolith is the right choice until team size or deployment frequency makes independent deployments worth the operational overhead.

---

## Summary

| Concern | Current | At Scale |
|---|---|---|
| Concurrency | Single process | Multiple replicas + load balancer |
| DB connections | Per-instance pool | PgBouncer proxy |
| Read load | Primary only | Read replicas |
| Caching | None | Redis (stats, user records) |
| Rate limiting | In-memory | Redis-backed store |
| Background jobs | None | Bull queue + workers |
| Logging | Local files | Centralized log aggregator |
