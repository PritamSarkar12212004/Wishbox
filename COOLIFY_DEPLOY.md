# 🚀 WishBox Frontend - Coolify Deployment Guide

## Unique Port
- **Host Port:** `30847`
- **Container Port:** `80`

## Deployment Steps in Coolify

1. **Create a new Service** in Coolify → select "Docker Compose" or "Dockerfile" source.
2. Connect your GitHub repository: `PritamSarkar12212004/Wishbox` (frontend folder).
3. Set the **Docker Compose file path** to: `docker-compose.yml`
4. Add Environment Variable:
   - `VITE_API_URL` = your backend API URL (e.g., `https://api.wishbox.com/api/v1`)
5. Set **Port** to `30847` (or let Coolify assign and map internally to `80`).
6. Click **Deploy**.

## Files Added/Modified
- `docker-compose.yml` — Compose config with port `30847:80`
- `.env` — Updated with port info comment
- `COOLIFY_DEPLOY.md` — This guide

## Notes
- The frontend is served via **nginx:alpine** on port 80 inside the container.
- Coolify maps host port `30847` → container port `80`.
- Make sure port `30847` is open on your server/firewall.
