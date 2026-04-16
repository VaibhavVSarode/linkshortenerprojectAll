# React and Next.js Conventions

## Next.js 16 App Router

### File Structure
```
app/
├── layout.tsx          # Root layout
├── page.tsx           # Home page
├── globals.css        # Global styles
├── loading.tsx        # Loading UI
├── error.tsx          # Error boundaries
├── not-found.tsx      # 404 page
└── [dynamic]/
    ├── page.tsx       # Dynamic routes
    └── layout.tsx     # Nested layouts
```

### Page Components
```tsx
// ✅ Good: Proper page structure
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Link Shortener | Create Short URLs',
  description: 'Create and manage shortened URLs with analytics',
};

export default function LinksPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Links</h1>
      {/* Page content */}
    </div>
  );
}
```

### Server Components vs Client Components
```tsx
// ✅ Server Component (default)
export default function ServerComponent() {
  // Can use async/await
  const data = await fetchData();

  return <div>{data}</div>;
}

// ✅ Client Component (when needed)
'use client';

import { useState } from 'react';

export default function ClientComponent() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

## React Hooks

### Custom Hooks
```tsx
// ✅ Good: Custom hook for data fetching
import { useState, useEffect } from 'react';

export function useLinks(userId: string) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/links`);
        const data = await response.json();
        setLinks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch links');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [userId]);

  return { links, loading, error };
}
```

### Hook Rules
- Only call hooks at the top level
- Only call hooks from React components or custom hooks
- Use ESLint rules for hook validation
- Prefer custom hooks for reusable logic

## Component Patterns

### Component Structure
```tsx
// ✅ Good: Clean component structure
interface LinkCardProps {
  link: Link;
  onDelete?: (id: string) => void;
}

export function LinkCard({ link, onDelete }: LinkCardProps) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      onDelete?.(link.id);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{link.shortCode}</h3>
          <p className="text-gray-600 truncate">{link.originalUrl}</p>
          <p className="text-sm text-gray-500">
            {link.clickCount} clicks • Created {formatDate(link.createdAt)}
          </p>
        </div>
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Props and State
```tsx
// ✅ Good: Proper prop types
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

// ✅ Good: Controlled components
export function LinkForm() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createLink({ url, customCode });
      setUrl('');
      setCustomCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to shorten"
        required
      />
      <Input
        value={customCode}
        onChange={(e) => setCustomCode(e.target.value)}
        placeholder="Custom code (optional)"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Link'}
      </Button>
    </form>
  );
}
```

## API Routes

### Route Handlers
```typescript
// app/api/links/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { links } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.userId, userId));

    return NextResponse.json(userLinks);
  } catch (error) {
    console.error('Failed to fetch links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { originalUrl, customCode } = body;

    // Validate input
    if (!originalUrl || typeof originalUrl !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    // Create short link
    const shortCode = customCode || generateShortCode();
    const newLink = await db.insert(links).values({
      userId,
      originalUrl,
      shortCode,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json(newLink[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Dynamic Routes
```typescript
// app/api/links/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { links } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const link = await db
      .select()
      .from(links)
      .where(eq(links.id, params.id))
      .limit(1);

    if (!link.length) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    return NextResponse.json(link[0]);
  } catch (error) {
    console.error('Failed to fetch link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Data Fetching

### Server-Side Data Fetching
```tsx
// ✅ Good: Server component with data fetching
async function getUserLinks(userId: string): Promise<Link[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/links`,
    {
      cache: 'no-store', // or 'force-cache' for static data
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch links');
  }

  return response.json();
}

export default async function LinksPage() {
  const links = await getUserLinks('user-id');

  return (
    <div>
      {links.map((link) => (
        <LinkCard key={link.id} link={link} />
      ))}
    </div>
  );
}
```

### Client-Side Data Fetching
```tsx
// ✅ Good: Client component with SWR or similar
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LinksList() {
  const { data: links, error, mutate } = useSWR('/api/links', fetcher);

  if (error) return <div>Failed to load links</div>;
  if (!links) return <div>Loading...</div>;

  return (
    <div>
      {links.map((link) => (
        <LinkCard key={link.id} link={link} onDelete={() => mutate()} />
      ))}
    </div>
  );
}
```

## Error Boundaries and Loading States

### Error Boundaries
```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

### Loading States
```tsx
// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}
```

## Performance Optimization

### Image Optimization
```tsx
import Image from 'next/image';

// ✅ Good: Optimized images
<Image
  src={link.thumbnailUrl}
  alt={link.title}
  width={300}
  height={200}
  className="rounded-lg"
  priority={index < 3} // Only for above-the-fold images
/>
```

### Code Splitting
```tsx
// ✅ Good: Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // If component requires browser APIs
});
```

### Memoization
```tsx
// ✅ Good: Memoize expensive calculations
import { useMemo } from 'react';

export function LinkStats({ links }: { links: Link[] }) {
  const stats = useMemo(() => {
    return {
      totalClicks: links.reduce((sum, link) => sum + link.clickCount, 0),
      totalLinks: links.length,
      avgClicks: links.length > 0
        ? links.reduce((sum, link) => sum + link.clickCount, 0) / links.length
        : 0,
    };
  }, [links]);

  return (
    <div>
      <p>Total Links: {stats.totalLinks}</p>
      <p>Total Clicks: {stats.totalClicks}</p>
      <p>Average Clicks: {stats.avgClicks.toFixed(1)}</p>
    </div>
  );
}
```