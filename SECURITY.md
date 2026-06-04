# Security Policy

## Sensitive Data

Do not commit API keys, Cloudflare tokens, DeepSeek keys, or private Worker URLs with tokens.

The PWA is intentionally local-first. Food logs are stored in browser `localStorage` unless the user configures an explicit sync endpoint.

## Recommended Setup

- Keep `DEEPSEEK_API_KEY` in Cloudflare Worker Secrets
- Use `PROXY_TOKEN` to protect `/estimate`
- Use `SYNC_TOKEN` to protect `/log` and `/logs`
- Rotate tokens if they appear in screenshots, logs, commits, or issue comments

## Reporting

This is a personal project. If you find a security issue, please open a private channel with the repository owner instead of posting secrets publicly.
