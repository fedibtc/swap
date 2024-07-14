# Fedi Swap Mod

A Fedi Mod for swapping between Lightning and on-chain Bitcoin using the Boltz API, as well as other cryptocurrencies using the FixedFloat API.

## Features

- Swap between Lightning Network and on-chain Bitcoin
- Support for additional cryptocurrencies (e.g., USDC, USDT)
- Real-time rate fetching and updates
- User-friendly interface with Fedi UI components

## Environment Variables

`FF_API_KEY` - FixedFloat API key
`FF_API_SECRET` - FixedFloat API secret

## Development

1. Install packages with `bun install`
2. Set the required environment variables in a `.env.local` file
3. Run the development server with `bun run dev`

## Deployment

1. Build the mod with `bun run build`
2. Start the production server with `bun run start`

## Technologies Used

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- @fedibtc/ui components
- FixedFloat API

## Project Structure

- `/app`: Next.js app router components and pages
- `/components`: Reusable Fedi Mod components
- `/lib`: Utility functions and API clients
- `/public`: Static assets

## API Integrations

- FixedFloat: Used for currency swaps and rate information
- Boltz: Implemented but not currently used (potential future integration)

For more details on the implementation, refer to the source code in the `/app` and `/lib` directories.
