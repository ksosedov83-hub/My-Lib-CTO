# Cosmic App

A Next.js 14+ application with a cosmic/space-themed UI featuring graph visualization capabilities.

## Features

- **Next.js 14+** with App Router and TypeScript
- **Tailwind CSS** for utility-first styling with custom cosmic color palette
- **Cosmic Background Theme** with animated starfield and gradient effects
- **Responsive Layout Shell** with header, sidebar, and main content area
- **State Management** with Zustand
- **Graph Visualization** powered by react-force-graph (2D and 3D support)
- **Icons** via Lucide React
- **Code Quality** with ESLint and Prettier

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the cosmic-themed application.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
/src
  /app              # Next.js App Router pages
    layout.tsx      # Root layout with fonts
    page.tsx        # Home page
    globals.css     # Global styles with cosmic theme
  /components       # React components
    AppShell.tsx    # Main layout shell with header/sidebar
  /stores           # Zustand state stores
    useAppStore.ts  # Example app state store
```

## Tech Stack

- **Framework:** Next.js 16.0.1
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Custom with Tailwind
- **State Management:** Zustand
- **Graph Visualization:** react-force-graph-2d, react-force-graph-3d, Three.js
- **Icons:** Lucide React
- **Code Quality:** ESLint, Prettier
- **Fonts:** Geist Sans & Geist Mono

## Cosmic Theme

The application features a custom cosmic/space theme with:

- Dark purple and blue gradient backgrounds
- Animated starfield with twinkling effect
- Glowing borders and shadow effects
- Responsive design across all breakpoints
- Custom color palette inspired by deep space

## Development

The app is fully typed with TypeScript and follows Next.js best practices. All components are modular and reusable.

### Adding New Pages

Create new pages in the `/src/app` directory following the App Router conventions.

### Using State Management

Import and use the Zustand store:

```typescript
import { useAppStore } from "@/stores/useAppStore";

const { sidebarCollapsed, toggleSidebar } = useAppStore();
```

## License

MIT
