# Component Structure and shadcn/ui Usage

## shadcn/ui Architecture

### Component Installation
```bash
# Install components
npx shadcn@latest add button input card dialog

# Components are installed to components/ui/
# Each component is self-contained with its own styles
```

### Component Configuration
```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

## Component Organization

### File Structure
```
components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── forms/                 # Form components
│   ├── LinkForm.tsx
│   └── EditLinkForm.tsx
├── layout/                # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── links/                 # Link-specific components
│   ├── LinkCard.tsx
│   ├── LinkList.tsx
│   └── LinkStats.tsx
└── shared/                # Shared/reusable components
    ├── LoadingSpinner.tsx
    ├── ErrorMessage.tsx
    └── EmptyState.tsx
```

### Component Categories
- **UI Components**: Basic building blocks (buttons, inputs, cards)
- **Layout Components**: Page structure and navigation
- **Feature Components**: Business logic specific components
- **Shared Components**: Reusable across features

## Component Patterns

### Base Component Structure
```tsx
// ✅ Good: Clean component structure
interface LinkCardProps {
  link: Link;
  onEdit?: (link: Link) => void;
  onDelete?: (id: string) => void;
  showStats?: boolean;
}

export function LinkCard({
  link,
  onEdit,
  onDelete,
  showStats = true
}: LinkCardProps) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      onDelete?.(link.id);
    }
  };

  return (
    <Card className="group relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-lg">
              {link.shortCode}
            </CardTitle>
            <CardDescription className="truncate">
              {link.originalUrl}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(link)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {showStats && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{link.clickCount} clicks</span>
            <span>{formatDate(link.createdAt)}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
```

### Compound Components
```tsx
// ✅ Good: Compound component pattern
interface LinkFormProps {
  onSubmit: (data: CreateLinkData) => Promise<void>;
  initialData?: Partial<CreateLinkData>;
  isLoading?: boolean;
}

export function LinkForm({ onSubmit, initialData, isLoading }: LinkFormProps) {
  const [formData, setFormData] = useState<CreateLinkData>({
    originalUrl: initialData?.originalUrl || '',
    customCode: initialData?.customCode || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormField name="originalUrl">
        <FormLabel>Original URL</FormLabel>
        <FormControl>
          <Input
            type="url"
            placeholder="https://example.com"
            value={formData.originalUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, originalUrl: e.target.value }))}
            required
          />
        </FormControl>
        <FormMessage />
      </FormField>

      <FormField name="customCode">
        <FormLabel>Custom Code (Optional)</FormLabel>
        <FormControl>
          <Input
            placeholder="my-link"
            value={formData.customCode}
            onChange={(e) => setFormData(prev => ({ ...prev, customCode: e.target.value }))}
          />
        </FormControl>
        <FormDescription>
          Leave empty for auto-generated code
        </FormDescription>
      </FormField>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Link'}
      </Button>
    </Form>
  );
}
```

## Form Components

### Form Validation
```tsx
// ✅ Good: Form validation with react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const linkSchema = z.object({
  originalUrl: z.string().url('Please enter a valid URL'),
  customCode: z.string().optional().refine(
    (val) => !val || /^[a-zA-Z0-9_-]+$/.test(val),
    'Custom code can only contain letters, numbers, hyphens, and underscores'
  ),
});

type LinkFormData = z.infer<typeof linkSchema>;

interface CreateLinkFormProps {
  onSubmit: (data: LinkFormData) => Promise<void>;
}

export function CreateLinkForm({ onSubmit }: CreateLinkFormProps) {
  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      originalUrl: '',
      customCode: '',
    },
  });

  const handleSubmit = async (data: LinkFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="originalUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Code (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="my-custom-link" {...field} />
              </FormControl>
              <FormDescription>
                Leave empty for auto-generated code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? 'Creating...' : 'Create Link'}
        </Button>
      </form>
    </Form>
  );
}
```

## Data Display Components

### Table Components
```tsx
// ✅ Good: Data table with sorting and pagination
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface LinkTableProps {
  links: Link[];
  onSort: (column: keyof Link) => void;
  sortColumn?: keyof Link;
  sortDirection?: 'asc' | 'desc';
}

export function LinkTable({ links, onSort, sortColumn, sortDirection }: LinkTableProps) {
  const SortButton = ({ column }: { column: keyof Link }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(column)}
      className="h-auto p-0 font-medium"
    >
      {column === sortColumn && sortDirection === 'asc' && <ChevronUp className="ml-2 h-4 w-4" />}
      {column === sortColumn && sortDirection === 'desc' && <ChevronDown className="ml-2 h-4 w-4" />}
    </Button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Short Code
              <SortButton column="shortCode" />
            </TableHead>
            <TableHead>
              Original URL
              <SortButton column="originalUrl" />
            </TableHead>
            <TableHead>
              Clicks
              <SortButton column="clickCount" />
            </TableHead>
            <TableHead>
              Created
              <SortButton column="createdAt" />
            </TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{link.shortCode}</TableCell>
              <TableCell className="max-w-[300px] truncate">{link.originalUrl}</TableCell>
              <TableCell>{link.clickCount}</TableCell>
              <TableCell>{formatDate(link.createdAt)}</TableCell>
              <TableCell>
                <LinkActions link={link} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Chart Components
```tsx
// ✅ Good: Chart component with recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ClickChartProps {
  data: Array<{
    date: string;
    clicks: number;
  }>;
}

export function ClickChart({ data }: ClickChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-muted-foreground"
            fontSize={12}
          />
          <YAxis
            className="text-muted-foreground"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
          <Bar
            dataKey="clicks"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Layout Components

### Navigation Components
```tsx
// ✅ Good: Responsive navigation
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              LinkShortener
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/links">My Links</NavLink>
              <NavLink href="/analytics">Analytics</NavLink>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-border">
              <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
              <MobileNavLink href="/links">My Links</MobileNavLink>
              <MobileNavLink href="/analytics">Analytics</MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
    >
      {children}
    </Link>
  );
}
```

### Page Layouts
```tsx
// ✅ Good: Dashboard layout
interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DashboardLayout({
  children,
  title,
  description,
  actions
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-4">
              {actions}
            </div>
          )}
        </div>

        {children}
      </main>
    </div>
  );
}
```

## Shared Components

### Loading States
```tsx
// ✅ Good: Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('animate-spin rounded-full border-2 border-muted border-t-primary', sizeClasses[size], className)} />
  );
}

// ✅ Good: Skeleton loading
export function LinkCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Error States
```tsx
// ✅ Good: Error message component
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  className
}: ErrorMessageProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}
```

### Empty States
```tsx
// ✅ Good: Empty state component
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Link,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <Icon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {action}
    </div>
  );
}
```

## Component Composition

### Higher-Order Components
```tsx
// ✅ Good: HOC for loading states
function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithLoadingComponent(props: P & { loading?: boolean }) {
    const { loading, ...restProps } = props;

    if (loading) {
      return <LoadingSpinner />;
    }

    return <Component {...(restProps as P)} />;
  };
}

// Usage
const LinkListWithLoading = withLoading(LinkList);
```

### Render Props Pattern
```tsx
// ✅ Good: Render props for flexible components
interface LinkDataProviderProps {
  children: (data: {
    links: Link[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export function LinkDataProvider({ children }: LinkDataProviderProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLinks();
      setLinks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  return children({
    links,
    loading,
    error,
    refetch: fetchLinks,
  });
}

// Usage
<LinkDataProvider>
  {({ links, loading, error, refetch }) => (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}
      {!loading && !error && <LinkList links={links} />}
    </div>
  )}
</LinkDataProvider>
```

## Performance Optimization

### Memoization
```tsx
// ✅ Good: Memoize expensive components
export const LinkCard = memo(function LinkCard({
  link,
  onEdit,
  onDelete
}: LinkCardProps) {
  // Component logic...
});

// ✅ Good: Memoize callbacks
export function LinkList({ links, onLinkUpdate }: LinkListProps) {
  const handleLinkUpdate = useCallback((linkId: string, updates: Partial<Link>) => {
    onLinkUpdate(linkId, updates);
  }, [onLinkUpdate]);

  // ...
}
```

### Code Splitting
```tsx
// ✅ Good: Lazy load heavy components
const AnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard'));

export function Dashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
```