# Monitoring & Observability

## Endpoints

| Endpoint      | Purpose                                    | Notes                                       |
| ------------- | ------------------------------------------ | ------------------------------------------- |
| `GET /health` | Liveness probe                             | Returns uptime and timestamp.               |
| `GET /ready`  | Readiness probe                            | Verifies database connectivity + timings.   |
| `GET /metrics`| Prometheus-compatible metrics stream       | Includes request counts, latency, uptime.   |
| `GET /docs`   | OpenAPI docs (Swagger UI)                  | Requires auth in production.                |

## Logging

- Pino logger via `nestjs-pino`, `bufferLogs` enabled during boot.
- Request metadata:
  - `requestId` from `RequestIdInterceptor` (also returned in response headers).
  - `userId` & `role` extracted from JWT (if authenticated).
- Sensitive fields filtered via `redact` (`authorization` header, plaintext passwords).

### Correlation

- `X-Request-Id` header accepted; otherwise generated UUID.
- Logs include `requestId` for correlation across services.

## Metrics

Current metrics are tracked in-memory:

- `http_request_total{method, route, status_code}`
- `http_request_duration_seconds_sum{...}`
- `process_uptime_seconds`

> If you need full Prometheus histograms, swap the `MetricsService` implementation for the `prom-client` backed version (original code retained in Git history).

## Alerting Recommendations

| Signal                     | Threshold / Alert condition                        |
| -------------------------- | -------------------------------------------------- |
| `process_uptime_seconds`   | Reset to < 60s unexpectedly (unplanned restarts).  |
| `http_request_total`       | Sudden drop (traffic anomaly).                     |
| `http_request_duration`    | 95th percentile > 300ms sustained.                 |
| `/ready` check             | Fails twice consecutively (DB unavailable).        |
| Audit logs volume          | Spike in sensitive actions (role changes, resets). |

## Tracing (Optional)

The project is structured to allow integration with OpenTelemetry or Sentry:

- Add `@nestjs/terminus` or `nestjs-otel` packages.
- Instrument service methods within `common` interceptors.
- Forward `requestId` as trace/span correlation ID.
