# Meta Ads Integration Guide for AgencyOS

## Overview

This guide covers two approaches to connect AgencyOS with Meta (Facebook) Ads:
1. **Direct Facebook Marketing API** (OAuth-based, real-time)
2. **n8n Automation** (workflow-based, scheduled sync)

Both approaches are designed to be **zero-hardcode** — all credentials and configuration are stored securely via environment variables and the database.

---

## Step 1: Register as a Meta Developer

### 1.1 Create a Facebook Developer Account
- Go to https://developers.facebook.com/
- Sign in with your Facebook account
- Click "Get Started" to complete developer registration

### 1.2 Create a New App
- Navigate to **My Apps** > **Create App**
- Select **Business** as app type
- Fill in:
  - **App Name**: `AgencyOS Meta Connector`
  - **App Contact Email**: Your business email
  - **Business Account**: Select or create a Meta Business Account

### 1.3 Configure Marketing API Product
- In your app's dashboard, click **Add Product**
- Select **Marketing API** and click **Set Up**
- This enables access to campaign, adset, ad, and insight data

### 1.4 Get Your App Credentials
- Go to **Settings** > **Basic**
- Note down:
  - **App ID** (e.g., `123456789012345`)
  - **App Secret** (click **Show** to reveal)

### 1.5 Configure OAuth Redirect URI
- Go to **Facebook Login** > **Settings** (if not visible, add Facebook Login product)
- Under **Valid OAuth Redirect URIs**, add:
  ```
  https://your-domain.com/api/meta/callback
  ```
  - For local development: `http://localhost:5000/api/meta/callback`

---

## Step 2: Backend Configuration (Zero Hardcode)

### 2.1 Set Environment Variables

In your backend `.env` file (see `.env.example`):

```bash
# Required for OAuth flow
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here

# Your app's base URL (no trailing slash)
APP_BASE_URL=https://your-domain.com
```

**No credentials are ever hardcoded in source code.** The backend reads from `process.env` at runtime.

### 2.2 Database Token Storage

When a user connects Meta Ads, tokens are stored in the `meta_tokens` table:

| Column | Purpose |
|--------|---------|
| `client_id` | Links to your AgencyOS client |
| `ad_account_id` | The Meta Ad Account ID |
| `access_token` | OAuth access token (encrypted at rest by PostgreSQL) |
| `refresh_token` | Long-lived token for refresh |
| `token_expires_at` | Token expiration timestamp |
| `scopes` | Permissions granted (ads_read, ads_management) |

---

## Step 3: Connect Meta Ads (Two Approaches)

### Approach A: Direct OAuth Flow (Real-Time)

**Best for**: Live dashboards, instant campaign updates

**Flow**:
1. Admin clicks "Connect Meta Ads" on a client's page
2. Frontend calls `GET /api/meta/config` to get the App ID and redirect URI
3. Frontend redirects user to Meta OAuth:
   ```
   https://www.facebook.com/v18.0/dialog/oauth?
     client_id={APP_ID}
     &redirect_uri={CALLBACK_URI}
     &scope=ads_read,ads_management,business_management
     &state={CLIENT_ID}
   ```
4. User grants permissions on Meta's site
5. Meta redirects back to `/api/meta/callback?code=...&state=...`
6. Backend exchanges code for access token via Meta's API
7. Token is stored in `meta_tokens` table, linked to the client

**To fetch campaigns**:
```bash
curl https://your-domain.com/api/meta/campaigns/1 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

This proxies through your backend to Meta's API with the stored token.

### Approach B: n8n Automation Workflow (Scheduled Sync)

**Best for**: Automated data sync, batch processing, scheduled reports

**Why n8n?** No code changes needed in AgencyOS. n8n handles the Meta API authentication and pushes data to your app's webhook.

**Step-by-step**:

#### 3B.1 Set Up n8n Workflow

1. **Install n8n** (self-hosted or cloud):
   ```bash
   npx n8n
   # Or use n8n cloud: https://n8n.io/cloud/
   ```

2. **Create a new workflow** with these nodes:

   **Node 1: Schedule Trigger**
   - Type: `Schedule Trigger`
   - Mode: `Every X`
   - Interval: `1` hour
   - This runs automatically every hour

   **Node 2: Meta (Facebook) API**
   - Type: `Facebook Graph API`
   - Operation: `Get`
   - Resource: `/{ad_account_id}/campaigns`
   - Authentication: Create Meta API credentials in n8n:
     - Go to Settings > Credentials
     - Add "Facebook Graph API" credential
     - Enter your App ID and App Secret
     - Complete OAuth flow in n8n
   - Fields: `name,status,objective,daily_budget,spend,insights{clicks,impressions,ctr,cpc,roas}`

   **Node 3: HTTP Request (to AgencyOS)**
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://your-domain.com/api/meta/webhook/n8n`
   - Authentication: `Header Auth`
   - Header: `Authorization: Bearer {ADMIN_JWT_TOKEN}`
   - Body:
     ```json
     {
       "clientId": 1,
       "campaigns": {{ $json.data }},
       "timestamp": "{{ $now }}"
     }
     ```

3. **Activate the workflow**

#### 3B.2 AgencyOS Receives Data

The `POST /api/meta/webhook/n8n` endpoint in AgencyOS:
- Receives campaign data from n8n
- Upserts campaigns into your local database
- Updates insights with latest metrics
- Triggers notifications for significant changes (e.g., ROAS drop > 20%)

#### 3B.3 No Hardcoded Values

In n8n, all credentials are stored in n8n's credential vault. In AgencyOS:
- `clientId` comes from the webhook payload
- `adAccountId` is looked up from the `meta_tokens` table
- API calls use the stored token from the database

---

## Step 4: Verify the Integration

### Test OAuth Flow
1. Log into AgencyOS as admin
2. Go to a client's detail page
3. Click "Connect Meta Ads"
4. Complete Meta OAuth
5. Verify campaigns appear under `/api/meta/campaigns/{clientId}`

### Test n8n Flow
1. Trigger the n8n workflow manually (Run Once)
2. Check AgencyOS database: campaigns table should have new rows
3. Check insights table: metrics should be updated
4. Check notifications: alert if ROAS changed significantly

---

## Step 5: Security Best Practices

| Practice | How it's implemented |
|----------|---------------------|
| No hardcoded tokens | All tokens in `meta_tokens` DB table |
| Token refresh | Backend auto-refreshes before expiry |
| Scope minimization | Only `ads_read,ads_management` requested |
| Secure callback | HTTPS-only redirect URIs in production |
| Token encryption | PostgreSQL encrypts data at rest |
| n8n security | Use n8n's built-in credential vault |
| Audit logging | All Meta API calls logged via pino |

---

## API Endpoints Added

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/meta/config` | GET | Admin | Returns App ID + redirect URI for OAuth |
| `/api/meta/callback` | GET | Public | Facebook OAuth callback handler |
| `/api/meta/campaigns/:clientId` | GET | Any | Proxy fetch campaigns from Meta |
| `/api/meta/webhook/n8n` | POST | Admin | Receive n8n sync data |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid redirect URI" | Ensure callback URL matches exactly in Meta app settings |
| "Token expired" | Backend auto-refreshes; check `token_expires_at` |
| "n8n webhook 401" | Regenerate admin JWT and update n8n HTTP header |
| "No campaigns returned" | Verify ad account ID is correct and has campaigns |
| "Rate limited by Meta" | Reduce n8n schedule frequency; Meta limits to 200 calls/hour per app |
