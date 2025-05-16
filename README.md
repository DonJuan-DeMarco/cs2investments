# CS2 Investment Tracker

A NextJS application for tracking your CS2 (Counter-Strike 2) investments. Monitor the value of your CS2 items over time, track profits, and visualize performance.

## Features

- Table view of all CS2 investments with details (name, purchase price, current price, etc.)
- Price history graph showing individual item performance or total portfolio value
- Modal for adding new items from the CS2 marketplace
- Real-time price updates from CSFloat API (with Steam Market fallback)
- Data persistence with Supabase

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Chart.js for data visualization
- Headless UI for accessible components
- Supabase for database storage
- CSFloat API for real-time market data

## Setup

### Prerequisites

- Node.js 18+ or Bun
- A Supabase account
- CSFloat API key (optional, can fallback to Steam Market)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cs2-investment-tracker.git
cd cs2-investment-tracker
```

2. Install dependencies:

```bash
bun install
```

3. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
CSFLOAT_API_KEY=your-csfloat-api-key (optional)
```

4. Set up the Supabase database:
   - Create a new Supabase project
   - Go to the SQL editor
   - Run the migration files from `supabase/migrations` directory
   - See detailed instructions in `supabase/README.md`

5. Start the development server:

```bash
bun run dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Adding Investments

1. Click the "Add Investment" button
2. Search for a CS2 item (e.g., "AWP Asiimov")
3. Select the item from the list
4. Enter the purchase details (price, quantity, date)
5. Click "Add Investment"

### Viewing Performance

- The table shows all your investments with current prices and profit/loss
- The graph displays total portfolio value over time
- Click on an item in the table to view its individual price history

## License

MIT
