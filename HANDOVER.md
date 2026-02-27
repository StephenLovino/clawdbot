# Developer Handover Document: OpenClaw (Clawdbot)

## Project Overview

This repository contains a customized version of the OpenClaw AI agent system. We have extended the core application to natively support **DeepSeek** as an AI provider alongside the default OpenRouter and Gemini integrations, and we've stabilized several bugs related to the WhatsApp channel implementation.

## Hosting & Architecture

- **Server:** Oracle VPS
  - **SSH Access:** `ssh ubuntu@138.2.5.166` (Requires the appropriate SSH key)
- **Deployment Platform:** [Coolify](https://coolify.io/)
- **Deployment Strategy:** Native Docker Compose
- **Repository:** `StephenLovino/clawdbot` (Branch: `main`)

The application is deployed directly via Coolify linked to this GitHub repository using the included `docker-compose.yml`. Coolify takes care of building the Docker images for the gateway and CLI services natively on the server.

### Required Environment Variables

For successful deployment via Coolify, ensure the following environment variables are set in the Coolify resource settings:

- `DEEPSEEK_API_KEY`
- `OPENROUTER_API_KEY` (if used)
- `GEMINI_API_KEY` (if used)
- `OPENCLAW_CONFIG_DIR` (e.g., `/mnt/openclaw/config`)
- `OPENCLAW_WORKSPACE_DIR` (e.g., `/mnt/openclaw/workspace`)

## Recent Modifications & Fixes

The recent development sprints have accomplished the following:

1. **DeepSeek Integration:**
   - Modified `auth-choice` option files to accept DeepSeek keys natively.
   - Configured `agents.defaults.model` to default to `deepseek/deepseek-chat` upon the first boot under the new deployment structure.

2. **Coolify Docker Support:**
   - Updated `docker-compose.yml` adding `build: .` context for native Coolify builds, enabling frictionless deployments without needing an external Docker registry.

3. **WhatsApp Stability Patches:**
   - **Status 515 Bug Fix:** Resolved a race condition where the OpenClaw daemon attempted to monitor WhatsApp session files concurrently while the login UI generated a QR code, resulting in an "Unknown Stream Errored" network conflict. The background service now safely pauses during QR code initialization.
   - **Status 401 Raw JSON UI Dump Fix:** Fixed an issue where expired WhatsApp sessions (or mobile device logouts) caused the Baileys driver to throw an unhandled Promise rejection containing a raw JSON payload (e.g. `{"error": {"data": {"reason": "401" ...}}}`). This caused the OpenClaw daemon to crash and render a raw text block in the UI. We wrapped `monitorWebInbox()` within `src/web/auto-reply/monitor.ts` in a robust `try/catch` sequence, isolating the failure, closing the loop cleanly, and triggering a friendly re-link prompt to the user instead.
   - **Pairing Deadlock Fix:** When a user previously started scanning a QR code but abandoned or refreshed the pairing UI, OpenClaw abruptly dropped the WebSocket socket. This orphaned Baileys' SQLite `creds.json` file lock on the VPS filesystem, preventing any subsequent UI logins for exactly 30 seconds before crashing completely. OpenClaw now rigorously executes `sock.end(undefined)` internally, fully unbinding the Baileys disk allocations immediately on a canceled session, and extends the UI grace scanning window from 3 to 5 minutes to prevent the background workers from hijacking the QR session.

## Current State & Remaining Work

- The codebase is fully patched. All strict TypeScript verification paths and tests passed successfully before pushing to `main`.
- The WhatsApp 515 and 401 unhandled connection crash loops are fully resolved. No current unresolved code issues.

**Action Required for Next Testing Phase:**

- Trigger a Coolify **Redeploy** to pull the latest codebase commit from `main`.
- Wait for the Coolify deployment to show `Healthy`.
- Authenticate standard channels (WhatsApp, Telegram) via CLI using `openclaw channels login web` or interactively via `node dist/index.js configure`.
- Verify the DeepSeek API handles incoming routing properly by conducting a chat in one of the active channels or via the web portal.

## Additional Notes

If schema connectivity issues occur upon initial boot, remember that OpenClaw disables all chat plugins to save memory by default. Explicitly enable necessary channels through the interactive wizard (`node dist/index.js configure -> Channels`) to expose the web schema!
