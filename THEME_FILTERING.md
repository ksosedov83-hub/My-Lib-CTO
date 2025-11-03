# Theme Filtering Feature

This document describes the theme filtering UX implementation for the Library Knowledge Graph.

## Overview

The theme filtering feature allows users to interactively filter books in the knowledge graph by selecting one or more themes. The graph dynamically updates to highlight matching nodes and dim non-matching ones, while maintaining the graph layout for a smooth user experience.

## Components

### ThemeFilterPanel

Located at: `src/components/ThemeFilterPanel.tsx`

**Features:**
- Multi-select checkboxes for each theme
- Visual theme color indicators
- "Select All" button to select all themes at once
- "Clear Filters" button to reset the selection
- Shows count of selected themes
- Displays list of currently selected themes
- Fully accessible with ARIA attributes
- Responsive design

**Usage:**
```tsx
import ThemeFilterPanel from "@/components/ThemeFilterPanel";

<ThemeFilterPanel className="optional-classes" />
```

### GraphLegend

Located at: `src/components/GraphLegend.tsx`

**Features:**
- Shows all available themes with their colors
- Displays connection type colors and labels
- Explains visual indicators:
  - Overlap badges (number indicates matching themes)
  - Color blending for multi-theme books
  - Dimmed appearance for non-matching nodes
- Configurable sections (themes, connections, overlap info)
- Responsive layout

**Usage:**
```tsx
import GraphLegend from "@/components/GraphLegend";

<GraphLegend 
  showThemes={true}
  showConnections={true}
  showOverlapInfo={true}
/>
```

### LibraryGraph (Enhanced)

Located at: `src/components/LibraryGraph.tsx`

**New Props:**
- `selectedThemes?: string[]` - Array of theme names to filter by

**Enhanced Features:**
- Highlights nodes matching selected themes (100% opacity)
- Dims non-matching nodes (20% opacity)
- Highlights edges between filtered nodes (60% opacity)
- Dims other edges (10% opacity)
- Shows overlap badges on nodes with multiple filtered themes
- Color blending for books with multiple themes
- Maintains graph layout when filters change (no reset)

**Usage:**
```tsx
import LibraryGraph from "@/components/LibraryGraph";
import { useAppStore } from "@/stores/useAppStore";

const selectedThemes = useAppStore((state) => state.selectedThemes);

<LibraryGraph
  selectedThemes={selectedThemes}
  onNodeClick={handleNodeClick}
  onNodeHover={handleNodeHover}
/>
```

## State Management

### useAppStore

The theme filter state is managed in `useAppStore` for UI-level state:

**State:**
- `selectedThemes: string[]` - Array of selected theme names

**Actions:**
- `toggleThemeFilter(themeName: string)` - Toggle a theme on/off
- `clearThemeFilters()` - Clear all selections
- `setThemeFilters(themes: string[])` - Set multiple themes at once

**Example:**
```tsx
const selectedThemes = useAppStore((state) => state.selectedThemes);
const toggleThemeFilter = useAppStore((state) => state.toggleThemeFilter);
const clearThemeFilters = useAppStore((state) => state.clearThemeFilters);

// Toggle a theme
toggleThemeFilter("Philosophy");

// Clear all filters
clearThemeFilters();
```

## Visual Indicators

### Node Highlighting

- **Matching nodes**: Full opacity (100%), original color
- **Non-matching nodes**: Low opacity (20%), grayed out
- **Hover/Selected**: Always visible regardless of filter

### Edge Highlighting

- **Edges between filtered nodes**: Higher opacity (60%)
- **Other edges**: Very low opacity (10%)

### Overlap Badges

When a book matches multiple selected themes, a badge appears in the top-right corner of the node showing the count:

```
┌─────┐
│  📘 │ 2  <- Badge showing 2 matching themes
└─────┘
```

The badge has:
- Purple background (#7c3aed)
- White border
- White number text
- Size: 10px diameter

## Responsive Design

### Desktop (lg and above)
- ThemeFilterPanel: Full width, collapsible
- GraphLegend: Fixed top-right corner

### Mobile/Tablet
- ThemeFilterPanel: Full width, collapsible
- GraphLegend: Bottom of screen (above tip box), full width
- Filter/Legend toggle buttons in header

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Attributes**: 
  - `aria-pressed` on filter checkboxes
  - `aria-label` for all buttons
  - `role="region"` on panels
  - `role="complementary"` on legend
  - `aria-live="polite"` for status updates
- **Focus Management**: Visible focus indicators with ring styles
- **Color Contrast**: All text meets contrast requirements
- **Screen Reader Support**: Descriptive labels and status messages

## Performance

The implementation is optimized for performance:

- **useMemo**: Graph data is memoized to prevent unnecessary recalculations
- **useCallback**: All handlers are memoized to prevent re-renders
- **Layout Preservation**: Graph layout is maintained when filters change
- **Debounced Rendering**: Only renders when necessary

## Integration Example

See `/src/app/graph/page.tsx` for the complete integration:

```tsx
"use client";

import { useState } from "react";
import LibraryGraph from "@/components/LibraryGraph";
import ThemeFilterPanel from "@/components/ThemeFilterPanel";
import GraphLegend from "@/components/GraphLegend";
import { useAppStore } from "@/stores/useAppStore";

export default function GraphPage() {
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const selectedThemes = useAppStore((state) => state.selectedThemes);

  return (
    <div>
      {showFilterPanel && <ThemeFilterPanel />}
      
      <div className="relative">
        <LibraryGraph selectedThemes={selectedThemes} />
        {showLegend && <GraphLegend />}
      </div>
    </div>
  );
}
```

## Testing

To test the feature:

1. Navigate to `/graph` page
2. Click "Show Filters" button (if hidden)
3. Select one or more themes from the filter panel
4. Observe the graph nodes and edges updating in real-time
5. Select multiple themes to see overlap badges
6. Click "Clear Filters" to reset
7. Toggle the legend on/off to see visual indicator explanations

## Future Enhancements

Potential improvements:
- Add theme combination presets (e.g., "Philosophy + Ethics")
- Save filter preferences in localStorage
- Add filter history/undo
- Export filtered graph view
- Add filter animation transitions
- Search/filter themes by name
