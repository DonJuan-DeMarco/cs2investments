Delete migration 
npx supabase migration repair --status reverted 20240501000000

# CS2 Investments Documentation

## Daily Price Updates

This application now uses a cron job system to fetch item prices daily instead of making real-time API calls. This improves performance and reduces API usage.

### Environment Variables Required

Add the following to your `.env.local` file:

```
CRON_SECRET=your-secret-key-here
NEXT_PUBLIC_CSFLOAT_API_KEY=your-csfloat-api-key
```

### Database Migration

Run the latest migration to create the price tables:

```bash
supabase db push
```

This will create:
- `item_prices` table for storing historical price data
- `latest_item_prices` view for getting the most recent price of each item

### Cron Job Schedule

- **Frequency**: Daily at 12:00 UTC
- **Endpoint**: `/api/cron/update-prices`
- **Method**: POST with Bearer token authentication

### Manual Price Update

To manually trigger a price update (for testing):

```bash
curl -X POST http://localhost:3000/api/cron/update-prices \
  -H "Authorization: Bearer your-cron-secret"
```

### Price Service

The frontend now uses `@/lib/price-service` instead of directly calling CSFloat API:
- `getItemPrice(itemId)` - Get latest price for one item
- `getItemPrices(itemIds)` - Get latest prices for multiple items
- `getItemPriceHistory(itemId, days)` - Get price history
- `getLastPriceUpdate()` - Check when prices were last updated

This change removes real-time API calls from the frontend and improves performance.