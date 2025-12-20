# Cloudflare D1 Setup Guide

This guide will help you set up Cloudflare D1 for persistent storage across all browsers.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)

## Setup Steps

### 1. Create D1 Database

```bash
wrangler d1 create chartdb
```

This will output a database ID. Copy it.

### 2. Update wrangler.jsonc

Replace `YOUR_D1_DATABASE_ID` in `wrangler.jsonc` with the database ID from step 1.

### 3. Run Database Migration

```bash
wrangler d1 execute chartdb --file=./migrations/0001_initial_schema.sql
```

### 4. Deploy to Cloudflare Pages

When deploying to Cloudflare Pages, make sure:
- The `functions` directory is included
- The D1 database binding is configured in your Cloudflare Pages dashboard

### 5. Environment Variables (Optional)

You can disable D1 sync by setting:
```
VITE_D1_SYNC_ENABLED=false
```

By default, D1 sync is enabled.

## How It Works

- **Local Storage (IndexedDB)**: Used for offline support and fast local access
- **Cloud Storage (D1)**: Used for cross-browser sync and persistence
- **Hybrid Approach**: 
  - Reads try D1 first, fallback to IndexedDB
  - Writes go to both (local first, then sync to D1)
  - Errors are handled gracefully (offline scenarios)

## API Endpoints

The following API endpoints are available:

- `GET /api/diagrams` - List all diagrams
- `GET /api/diagrams?diagramId=...` - Get single diagram
- `POST /api/diagrams` - Create diagram
- `PUT /api/diagrams` - Update diagram
- `DELETE /api/diagrams` - Delete diagram
- `POST /api/tables` - Create table
- `PUT /api/tables` - Update table
- `DELETE /api/tables` - Delete table
- `POST /api/relationships` - Create relationship
- `PUT /api/relationships` - Update relationship
- `DELETE /api/relationships` - Delete relationship
- `GET /api/config` - Get config
- `PUT /api/config` - Update config

All endpoints require a `workspaceId` query parameter (automatically handled by the API client).

## Local Development

For local development with D1:

```bash
# Start local D1 database
wrangler d1 execute chartdb --local --file=./migrations/0001_initial_schema.sql

# Run dev server (make sure to use wrangler dev for Pages Functions)
wrangler pages dev dist --d1=DB=chartdb
```

## Troubleshooting

- **Database not found**: Make sure you've created the D1 database and updated the ID in `wrangler.jsonc`
- **Migration errors**: Check that the SQL file is valid and run it again
- **Sync not working**: Check browser console for errors and verify the API endpoints are accessible
- **CORS issues**: Make sure your Cloudflare Pages Functions are properly configured

