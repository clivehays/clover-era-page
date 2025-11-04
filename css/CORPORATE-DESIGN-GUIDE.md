# Corporate Design System Guide

## Quick Start

Add this line to the `<head>` section of every HTML page:

```html
<link rel="stylesheet" href="/css/corporate-design.css">
```

## Migration Checklist

When updating a page to use the corporate design system:

### 1. **Add the CSS file**
```html
<link rel="stylesheet" href="/css/corporate-design.css">
```

### 2. **Update button classes**
- Change all coral/indigo buttons to use `.btn-primary`, `.btn-secondary`, or `.btn-teal`
- Remove inline `text-transform: uppercase` styles
- Change button text from "BOOK DEMO" to "Book demo"

### 3. **Update badges**
- Use `.badge` or `.badge-subtle` classes
- Change text from uppercase to sentence case
- Remove `border-radius: 50px`, use `.radius-md` instead

### 4. **Update cards**
- Use `.card` class for consistent styling
- Change `border-radius: 15px` to `.radius-md` (8px)
- Remove heavy box shadows

### 5. **Update form elements**
- Use `.form-input`, `.form-label`, `.form-select` classes
- Remove uppercase from labels
- Change `border-radius: 10px` to `.radius-md`

### 6. **Update stats**
- Use `.stat-card`, `.stat-number`, `.stat-label` classes
- Remove uppercase from labels
- Change purple colors to teal using `var(--primary-teal)`

### 7. **Color replacements**
Replace old colors with new variables:
- `#FF6B6B` (coral) → `var(--charcoal)` for buttons
- `#6366F1` (indigo) → `var(--primary-teal)`
- `#8B5CF6` (purple) → `var(--primary-teal)`
- `border-radius: 50px` → `var(--radius-md)` (8px)
- `border-radius: 15px/20px` → `var(--radius-md)` (8px)

### 8. **Typography updates**
- Change `letter-spacing: 0.05em` to `var(--letter-spacing-tight)` (0.01em)
- Change `letter-spacing: 0.1em` to `var(--letter-spacing-tight)` (0.01em)
- Ensure `line-height: 1.75` on body
- Remove `text-transform: uppercase` throughout

## Available Classes

### Buttons
- `.btn-primary` - Charcoal button (main CTA)
- `.btn-secondary` - White button with border
- `.btn-teal` - Teal button (alternate CTA)
- `.btn-group` - Container for button groups

### Badges
- `.badge` - Solid teal badge
- `.badge-subtle` - Light teal badge with border
- `.badge-priority` - Small priority badge

### Cards
- `.card` - Standard card with hover effect
- `.card-title` - Card heading
- `.card-description` - Card body text
- `.stat-card` - Statistics card
- `.stat-number` / `.stat-value` - Large stat number
- `.stat-label` - Stat description

### Forms
- `.form-group` - Form field container
- `.form-label` - Form field label
- `.form-input` - Text input
- `.form-select` - Select dropdown
- `.form-textarea` - Textarea

### Sections
- `.section` - Standard section padding
- `.section-light` - White background
- `.section-gray` - Light gray background
- `.section-header` - Centered section header

### Utilities
- `.text-normal` - Remove text transform
- `.text-teal` - Teal text color
- `.text-charcoal` - Charcoal text color
- `.bg-white` / `.bg-light` / `.bg-teal` - Backgrounds
- `.shadow-xs` / `.shadow-sm` / `.shadow-md` - Shadows
- `.radius-sm` / `.radius-md` / `.radius-lg` - Border radius
- `.mt-1` through `.mt-5` - Margin top
- `.mb-1` through `.mb-5` - Margin bottom

## CSS Variables

### Colors
```css
--primary-teal: #46AEB8
--deep-teal: #0D7C88
--charcoal: #1F2937
--white: #FFFFFF
--light-gray: #F8F9FA
--medium-gray: #E5E7EB
--text-primary: #111827
--text-secondary: #4B5563
```

### Spacing
```css
--spacing-xs: 8px
--spacing-sm: 16px
--spacing-md: 24px
--spacing-lg: 32px
--spacing-xl: 48px
--spacing-2xl: 64px
--spacing-3xl: 96px
```

### Border Radius
```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-full: 50%
```

### Shadows
```css
--shadow-xs: 0 1px 3px rgba(0, 0, 0, 0.05)
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08)
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1)
--shadow-primary: 0 2px 8px rgba(31, 41, 55, 0.15)
--shadow-teal: 0 2px 8px rgba(70, 174, 184, 0.15)
```

## Examples

### Before & After Button

**Before:**
```html
<a href="#" style="background: #FF6B6B; color: white; padding: 1.2rem 3rem; border-radius: 50px; text-transform: uppercase; box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);">
    BOOK YOUR DEMO
</a>
```

**After:**
```html
<a href="#" class="btn-primary">
    Book your demo
</a>
```

### Before & After Card

**Before:**
```html
<div style="background: white; border-radius: 15px; padding: 2.5rem; box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);">
    <h3>Card Title</h3>
    <p>Card description</p>
</div>
```

**After:**
```html
<div class="card">
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">Card description</p>
</div>
```

### Before & After Badge

**Before:**
```html
<span style="background: var(--primary-teal); padding: 0.75rem 2rem; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.1em;">
    NEW FEATURE
</span>
```

**After:**
```html
<span class="badge">
    New feature
</span>
```

## Priority Order for Updates

1. **High Priority** (User-facing, high traffic):
   - index.html ✓
   - how-it-works.html ✓
   - calculator/index.html
   - 30-day-free-pilot/index.html
   - assessment/index.html
   - about.html
   - contact.html

2. **Medium Priority** (SEO landing pages):
   - burnout/index.html
   - employee-stress/index.html
   - All solution/problem pages

3. **Lower Priority**:
   - Blog pages
   - Legal pages
   - Admin pages

## Testing Checklist

After updating a page:
- [ ] All buttons are sentence case, not uppercase
- [ ] Border radius is 8px, not 50px/15px/20px
- [ ] Letter spacing is 0.01em, not 0.05-0.1em
- [ ] Shadows are subtle (--shadow-sm, not heavy)
- [ ] Colors use charcoal instead of coral for primary buttons
- [ ] Inline stat colors use teal instead of purple
- [ ] Forms have consistent styling
- [ ] Mobile responsive (test at 768px width)
- [ ] Hover states work properly
- [ ] No console errors

## Support

For questions about the design system, reference:
- `/css/corporate-design.css` - The source of truth
- `/index.html` - Example implementation
- `/how-it-works.html` - Example implementation
