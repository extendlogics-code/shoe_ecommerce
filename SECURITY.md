# Security Guidance

This project follows the OWASP Top 10 2021 guidance as a baseline. The table below summarises the primary mitigations expected by this frontend and its paired APIs.

| OWASP Top 10 | Risk Area | Frontend Expectations | Backend / Infra Expectations |
| --- | --- | --- | --- |
| A01:2021 – Broken Access Control | Route and component gating | All protected screens should resolve server-side authorisation before rendering. Never rely on client-side checks alone. | Enforce RBAC/ABAC on every endpoint; use strict allowlists and short-lived access tokens. |
| A02:2021 – Cryptographic Failures | Secure transport & secrets | Require HTTPS in all environments and read configuration via `import.meta.env`. Do not embed credentials in the bundle. | Enable HSTS, TLS 1.2+, rotate secrets, and store encryption keys in a managed vault. |
| A03:2021 – Injection | Untrusted content | Avoid `dangerouslySetInnerHTML`. Sanitise CMS content with a trusted library before render. | Use parameterised queries and server-side validation. |
| A04:2021 – Insecure Design | Threat modelling | Document abuse cases for checkout, cart and account flows; ensure UX handles error paths cleanly. | Run regular threat modelling sessions; design compensating controls (rate limits, anomaly detection). |
| A05:2021 – Security Misconfiguration | Hardening | Apply CSP/meta headers (see `index.html`), lock down third-party origins, bundle only necessary assets. | Automate hardened configs (IaC), keep frameworks updated, review CORS policies. |
| A06:2021 – Vulnerable and Outdated Components | Dependencies | Track updates for React, Vite, Framer Motion, etc. Use `npm run audit` in CI. | Apply the same policy server-side; maintain SBOM. |
| A07:2021 – Identification and Authentication Failures | Session hygiene | Never persist tokens in `localStorage`; prefer HttpOnly cookies or memory storage. | Implement MFA for privileged flows, add refresh-token rotation and anomaly checks. |
| A08:2021 – Software and Data Integrity Failures | Supply chain | Commit lockfiles and validate CI builds. Sign production artifacts where possible. | Verify build provenance, require signed images and deployment approvals. |
| A09:2021 – Security Logging and Monitoring Failures | Client telemetry | Capture non-PII error telemetry (e.g. Sentry) and surface suspicious events to the backend. | Centralise logs, implement alerting for auth/payment anomalies. |
| A10:2021 – Server-Side Request Forgery | External calls | Do not allow user-controlled URLs client-side. Interact only with vetted API gateways. | Enforce allowlists and network segmentation for outbound requests. |

## Operational Checklist

1. Enforce the CSP and security headers defined in `index.html` at the CDN / edge layer.
2. Wire `npm run audit` (and optional Snyk/GitHub Advisory scans) into CI to block vulnerable packages.
3. Maintain an architecture threat model and revisit after feature launches.
4. Rotate credentials and purge secrets from git history where necessary.
5. Capture structured logs for authentication, payment, and account-management events.

For additional context or updates, open a security issue with reproduction details and contact the project maintainers privately if sensitive data is involved.
