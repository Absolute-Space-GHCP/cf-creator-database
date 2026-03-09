---
paths:
  - "src/**/*.{js,ts}"
  - "scraper/**/*.py"
---

# Security Guidance

## Input Validation
- Validate all user inputs (query params, body, headers)
- Use Zod schemas for API request validation
- Sanitize data before database operations
- Never trust client-side data

## Authentication & Authorization
- Protect sensitive endpoints with auth middleware
- Use environment variables for secrets (never hardcode)
- Implement rate limiting on public endpoints
- Validate API keys and tokens

## Data Protection
- Never log sensitive data (API keys, passwords, PII)
- Use HTTPS for all external communications
- Implement proper error messages (don't leak internal details)

## Code Injection Prevention
- Avoid `eval()` and similar dynamic code execution
- Parameterize database queries
- Escape HTML output (prevent XSS)
- Validate file paths (prevent path traversal)

## Dependencies
- Keep dependencies updated (`npm audit`)
- Review new dependencies before adding
- Pin dependency versions
