# Changelog

## [0.1.0] - 2026-10-26

### Added

- Indonesian review sentiment analysis with Gemini and deterministic local fallback.
- Executive summary, sentiment distribution, complaint and praise themes, and action recommendations.
- Customer-service reply generation and spreadsheet-friendly CSV/JSON export.
- Distributed production rate limiting with a bounded local development fallback.
- Automated unit, integration, build, security-audit, and browser E2E quality gates.

### Security

- Zod validation at API and model-output boundaries.
- Spreadsheet formula neutralization in CSV exports.
- Email and phone-number redaction before Gemini requests.
- Content Security Policy and standard browser security headers.
