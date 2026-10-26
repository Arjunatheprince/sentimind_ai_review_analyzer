# ADR-001: Resilient AI analysis with validated fallback

## Status

Accepted

## Date

2026-10-26

## Context

Sentimind depends on Gemini for nuanced Indonesian sentiment analysis. Public demos must remain usable when the model is unavailable, while preventing untrusted model output and abusive traffic from reaching application logic or exhausting API quota.

## Decision

- Validate every request and every Gemini JSON response with Zod.
- Use deterministic generation settings and cache identical validated analyses for 30 minutes.
- Fall back to a deterministic local analyzer when Gemini is unavailable and disclose that source in the UI.
- Apply separate limits to analysis and reply endpoints. Production uses Upstash Redis so limits are shared across serverless instances; development falls back to a bounded in-memory limiter.
- Redact email addresses and Indonesian phone numbers before reviews are sent to Gemini.

## Alternatives considered

### Fail whenever Gemini is unavailable

Rejected because a portfolio demo should remain explorable during provider outages or quota exhaustion.

### In-memory rate limiting only

Rejected for production because counters are not shared across serverless instances.

### Trust JSON mode without application validation

Rejected because model output is external, untrusted data and may still violate the application contract.

## Consequences

- Production deployments require `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for reliable distributed limits.
- Local fallback classifications are less nuanced and are visibly labeled as heuristic.
- The application remains functional during transient Gemini failures without presenting fallback output as AI-generated.
