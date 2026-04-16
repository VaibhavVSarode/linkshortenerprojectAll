# Tailwind CSS and Styling Guidelines

## Tailwind CSS v4 Configuration

### Theme Configuration
- Uses CSS custom properties for design tokens
- Radix Nova color scheme with neutral base
- CSS variables defined in `globals.css`
- Supports light/dark mode with `dark:` prefix

### Key Design Tokens
```css
/* Available in globals.css */
--color-primary: /* Primary brand color */
--color-secondary: /* Secondary color */
--color-muted: /* Muted background */
--color-border: /* Border colors */
--color-ring: /* Focus ring colors */
--radius: /* Border radius base */
```

## Utility-First Approach

### ClassName Patterns
```tsx
// ✅ Good: Semantic class combinations
<div className="flex items-center justify-between p-4 border-b border-border">
  <h3 className="font-semibold text-foreground">Link Title</h3>
  <Button variant="outline" size="sm">Edit</Button>
</div>

// ✅ Good: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

// ✅ Good: State-based styling
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  Submit
</button>
```

### Avoid Inline Styles
```tsx
// ❌ Bad: Inline styles override Tailwind
<div style={{ backgroundColor: 'red', padding: '1rem' }}>
  Content
</div>

// ✅ Good: Use Tailwind classes
<div className="bg-red-500 p-4">
  Content
</div>
```

## Component Styling

### shadcn/ui Components
- Use pre-built components from `@/components/ui/*`
- Customize via `className` prop and CSS variables
- Follow component API patterns

```tsx
// ✅ Good: shadcn component usage
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function LinkForm() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Create New Link</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Enter URL" />
        <Input placeholder="Custom code (optional)" />
        <Button className="w-full">Create Link</Button>
      </CardContent>
    </Card>
  );
}
```

### Custom Component Classes
```tsx
// ✅ Good: Custom component with Tailwind
export function LinkCard({ link }: { link: Link }) {
  return (
    <div className="group relative p-6 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate">
            {link.shortCode}
          </h3>
          <p className="text-muted-foreground text-sm truncate mt-1">
            {link.originalUrl}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

## Responsive Design

### Breakpoint Strategy
```tsx
// ✅ Good: Mobile-first responsive design
<div className="container mx-auto px-4 py-8">
  {/* Mobile: single column */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/* Responsive grid */}
  </div>

  {/* Stacked on mobile, side-by-side on larger screens */}
  <div className="flex flex-col lg:flex-row gap-8">
    <div className="flex-1">
      <h2 className="text-xl font-bold mb-4">Links</h2>
      {/* Content */}
    </div>
    <div className="w-full lg:w-80">
      <h2 className="text-xl font-bold mb-4">Stats</h2>
      {/* Sidebar */}
    </div>
  </div>
</div>
```

### Common Breakpoints
- `sm:` 640px and up
- `md:` 768px and up
- `lg:` 1024px and up
- `xl:` 1280px and up
- `2xl:` 1536px and up

## Dark Mode Support

### Theme Implementation
```tsx
// ✅ Good: Theme-aware components
export function ThemeToggle() {
  return (
    <Button variant="outline" size="sm">
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// ✅ Good: Theme-aware styling
<div className="bg-background text-foreground border border-border">
  <h1 className="text-2xl font-bold">Dashboard</h1>
  <p className="text-muted-foreground">Welcome back!</p>
</div>
```

### CSS Variables Usage
```css
/* Custom theme variables */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

## Animation and Transitions

### Transition Patterns
```tsx
// ✅ Good: Smooth transitions
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-md transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95">
  Click me
</button>

// ✅ Good: State transitions
<div className="relative overflow-hidden rounded-lg">
  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  <div className="relative p-6">
    {/* Content */}
  </div>
</div>
```

### Animation Libraries
- Use `tw-animate-css` for complex animations
- Prefer CSS transitions for simple state changes
- Avoid heavy animation libraries unless necessary

## Layout Patterns

### Container and Spacing
```tsx
// ✅ Good: Consistent spacing
<div className="min-h-screen bg-background">
  <header className="border-b border-border">
    <div className="container mx-auto px-4 py-4">
      <nav className="flex items-center justify-between">
        {/* Navigation */}
      </nav>
    </div>
  </header>

  <main className="container mx-auto px-4 py-8">
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main content */}
    </div>
  </main>
</div>
```

### Grid and Flexbox
```tsx
// ✅ Good: Flexbox for navigation
<nav className="flex items-center space-x-6">
  <Link href="/" className="text-foreground hover:text-primary transition-colors">
    Home
  </Link>
  <Link href="/links" className="text-foreground hover:text-primary transition-colors">
    My Links
  </Link>
</nav>

// ✅ Good: Grid for cards
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {links.map((link) => (
    <LinkCard key={link.id} link={link} />
  ))}
</div>
```

## Custom CSS

### When to Use Custom CSS
- Complex animations not possible with Tailwind
- Custom scrollbar styling
- CSS Grid with named grid areas
- Print styles

```css
/* ✅ Good: Custom CSS in component styles */
.link-card {
  @apply relative p-6 bg-card border border-border rounded-lg shadow-sm;
}

.link-card:hover {
  @apply shadow-md;
}

/* Custom animation */
@keyframes slide-in {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in {
  animation: slide-in 0.3s ease-out;
}
```

### CSS Modules (if needed)
```css
/* styles.module.css */
.container {
  @apply flex flex-col min-h-screen;
}

.header {
  @apply bg-primary text-primary-foreground p-4;
}
```

```tsx
// Usage
import styles from './styles.module.css';

export function Layout({ children }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>Header</header>
      {children}
    </div>
  );
}
```

## Performance Considerations

### Optimize Bundle Size
- Use Tailwind's purging (automatic in v4)
- Avoid unused CSS classes
- Use component-level CSS when appropriate
- Minimize custom CSS

### Loading Performance
```tsx
// ✅ Good: Critical CSS inlined
// Use Next.js for automatic optimization

// ✅ Good: Lazy load heavy components
const AnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />
});
```

## Accessibility

### Focus Management
```tsx
// ✅ Good: Visible focus indicators
<button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md">
  Button
</button>

// ✅ Good: Skip links
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
>
  Skip to main content
</a>
```

### Color Contrast
- Use design tokens that meet WCAG guidelines
- Test color combinations for accessibility
- Provide sufficient contrast ratios

### Semantic HTML
- Use appropriate HTML elements
- Maintain logical heading hierarchy
- Use ARIA labels when needed
- Test with screen readers