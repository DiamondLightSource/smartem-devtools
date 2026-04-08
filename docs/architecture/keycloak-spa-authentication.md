# Keycloak Authentication for SmartEM SPA

This document describes how Keycloak authentication works in the SmartEM frontend (SPA) and how it integrates with the FastAPI backend. It serves as a reference for implementing and understanding the auth flow.

---

## The three parties

```
┌──────────┐       ┌──────────────┐       ┌─────────────┐
│ Keycloak │       │  SPA (browser)│       │  Backend API│
│ (IdP)    │       │  smartem-app  │       │  FastAPI    │
└──────────┘       └──────────────┘       └─────────────┘
```

The SPA authenticates directly with Keycloak. The backend is not a proxy — it's a separate party that independently validates the tokens.

## The flow in detail

### 1. Login (SPA ↔ Keycloak only, backend not involved)

The SPA redirects the user's browser to Keycloak's login page. This is a full page redirect — `keycloak-js` handles it. The user authenticates at Keycloak (username/password, SSO, federated identity, whatever the realm is configured for). Keycloak redirects back to the SPA with an authorisation code. `keycloak-js` exchanges that code for three tokens:

- **Access token** (JWT, short-lived, ~5min) — this is what gets sent to the backend
- **ID token** (JWT) — contains user profile claims (name, email, fedId)
- **Refresh token** (opaque, longer-lived) — used to get new access tokens without re-login

All of this happens in the browser. The backend doesn't see any of it.

### 2. API calls (SPA → Backend, token attached)

Every API request includes `Authorization: Bearer <access_token>`. The frontend implements this via an Axios interceptor in the API package. The backend's job is to **validate** that token — it never talks to Keycloak during normal request handling.

### 3. Token validation (Backend, standalone)

When the backend receives a request with a Bearer token, it needs to:

1. Decode the JWT
2. Verify the signature against Keycloak's public keys (fetched once from Keycloak's JWKS endpoint and cached)
3. Check `exp` (not expired), `iss` (correct Keycloak realm), `aud` (correct client)
4. Extract claims (user identity, roles) for authorisation decisions

This is **offline validation** — the backend doesn't call Keycloak per-request. It just needs the public keys, which it fetches once (and refreshes periodically). This is why the backend doesn't "proxy to Keycloak" — it independently verifies tokens using public-key cryptography.

### 4. Token refresh (SPA ↔ Keycloak, backend not involved)

The frontend implements smart refresh scheduling — it calculates when the access token expires and refreshes 10 seconds before. `keycloak-js` uses the refresh token to get a new access token from Keycloak silently (no user interaction). The new token gets pushed to the API client's auth header.

## What this means for SmartEM

The frontend handles the entire auth ceremony with Keycloak independently. The backend doesn't need to change for auth to *work* in the frontend — login/logout, token refresh, user profile display all function without backend support.

What the backend needs to add is **token validation** — a FastAPI dependency that verifies the Bearer token. Until then, the tokens are sent but ignored. This is a valid phased approach.

## Prerequisites

A **Keycloak client registration** is required — someone needs to create a `smartem-frontend` client in the DLS Keycloak realm (`identity.diamond.ac.uk`) with:

- Client type: public (SPAs can't keep secrets)
- Valid redirect URIs (the SPA's URL)
- Web origins (for CORS)

Without this, `keycloak-js` has nowhere to redirect to.
