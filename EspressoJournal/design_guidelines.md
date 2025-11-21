# Coffee Tracking Application - Design Guidelines

## Design Approach
**System:** Productivity App Pattern (inspired by Linear, Notion, Airtable)  
**Rationale:** This is a utility-focused data management tool requiring efficient form entry, clear data visualization, and rapid interaction patterns.

## Core Design Principles
1. **Efficiency First:** Minimize clicks and cognitive load for frequent logging
2. **Scannable Data:** Entries should be quickly readable at a glance
3. **Input Clarity:** Form fields with clear labels and helpful affordances
4. **No Distractions:** Clean interface focused on the task

## Typography
- **Primary Font:** Inter (Google Fonts) - clean, readable for data
- **Hierarchy:**
  - Page Title: text-3xl font-bold
  - Section Headers: text-xl font-semibold
  - Field Labels: text-sm font-medium uppercase tracking-wide
  - Body/Input Text: text-base
  - Helper Text: text-sm text-gray-600

## Layout System
**Spacing Units:** Tailwind 2, 4, 6, 8, 12 for consistency
- Form spacing: gap-6 between field groups, gap-4 within groups
- Card padding: p-6
- Section margins: mb-8 to mb-12
- Page container: max-w-6xl mx-auto px-4 py-8

**Grid Structure:**
- Form: Single column, max-w-2xl for optimal readability
- Coffee entries: Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) for cards

## Component Library

### Form Components
**Input Fields (Text/Number/Date):**
- Full width with subtle border, rounded-lg
- Focus state: border highlight with ring effect
- Labels above inputs with required indicators
- Helper text below for guidance (e.g., "e.g., 250g, 1kg")

**Dropdown Selects:**
- Roast Level: Light, Medium, Medium-Dark, Dark
- Form Factor: Whole Beans, Pre-Ground
- Styled consistently with text inputs

**Rating Sliders:**
- Four dedicated sliders for: Bitterness, Acidity, Note Clarity, Overall Taste
- Display current value (1-10) prominently beside slider
- Visual markers at intervals
- Each slider in its own labeled container with gap-2

**Reorder Toggle:**
- Large, clear toggle switch
- Label: "Worth Reordering?"
- Prominent visual distinction between Yes/No states

**Action Buttons:**
- Primary (Add/Save): Solid, rounded-lg, px-6 py-3
- Secondary (Cancel/Edit): Outlined variant
- Destructive (Delete): Red accent for clear warning
- Icons from Heroicons via CDN

### Coffee Entry Cards
**Layout:**
- Rounded-xl cards with subtle shadow
- Padding: p-6
- Each card shows:
  - Brand name as card header (text-lg font-semibold)
  - Two-column info grid: Date, Quantity, Roast, Form Factor
  - Tasting notes in dedicated section (text-sm, italic)
  - Rating summary: Four compact rating bars showing scores
  - Reorder badge: Pill-shaped indicator
  - Edit/Delete action buttons in card footer

**Rating Visualization:**
- Horizontal bar indicators for each rating aspect
- Label + filled bar representation (e.g., "Bitterness: ███████░░░ 7/10")
- Compact, space-efficient display

### Navigation & Layout
**Header:**
- Page title: "My Espresso Journal" or "Coffee Tracker"
- Subtitle with entry count
- No complex navigation needed (single page)

**Form Section:**
- Positioned at top or in expandable/modal panel
- Clear "Add New Coffee" button to reveal form
- Form can be persistent or toggle-based

**Entries Section:**
- Search/filter bar (optional but valuable): Filter by roast, form factor, reorder status
- Sort options: By date, rating, brand name
- Empty state message with friendly illustration placeholder

### Icons
**Library:** Heroicons (via CDN)
**Usage:**
- Coffee cup icon for page branding
- Star/rating icons for rating displays
- Calendar for date fields
- Package for quantity
- Leaf/bean for roast/form indicators
- Edit (pencil) and delete (trash) for actions

## Layout Structure
```
[Header: Page Title + Stats]
  ↓
[Add Coffee Form Section] (collapsible/modal)
  - Input fields in logical groups
  - Rating sliders section
  - Reorder toggle
  - Submit button
  ↓
[Filter/Sort Controls]
  ↓
[Coffee Entries Grid]
  - Responsive card grid
  - Each card: full coffee details
  ↓
[Empty State] (when no entries)
```

## Interactions
- Form validation: Real-time for required fields
- Slider interaction: Smooth, responsive drag with value preview
- Card actions: Edit opens form with pre-filled data, Delete with confirmation
- Success feedback: Brief toast notification on add/edit/delete
- Loading states: Skeleton cards while data loads

## Accessibility
- All form inputs with proper labels and ARIA attributes
- Keyboard navigation for all interactive elements
- Focus indicators on all focusable elements
- Sufficient contrast ratios throughout
- Slider values announced to screen readers

## No Images Required
This is a data-focused application - no hero images or decorative imagery needed. Focus on clean UI and data presentation.