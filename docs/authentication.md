# Authentication with Clerk

## Clerk Setup

### Environment Configuration
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Root Layout Integration
```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Authentication Components

### Sign-In and Sign-Up Pages
```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  );
}

// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  );
}
```

### User Button Component
```tsx
// components/UserButton.tsx
'use client';

import { UserButton } from '@clerk/nextjs';

export function CustomUserButton() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'h-8 w-8',
          userButtonPopoverCard: 'shadow-lg border',
        },
      }}
      afterSignOutUrl="/"
    />
  );
}
```

## Protected Routes

### Middleware Protection
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/links(.*)',
  '/api/links(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### Component-Level Protection
```tsx
// components/ProtectedComponent.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedComponent({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
```

## Server-Side Authentication

### API Route Protection
```typescript
// app/api/links/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated, proceed with logic
  const links = await getUserLinks(userId);
  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create link for authenticated user
  const body = await request.json();
  const newLink = await createLink({ ...body, userId });

  return NextResponse.json(newLink, { status: 201 });
}
```

### Server Component Authentication
```tsx
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user-specific data
  const links = await getUserLinks(userId);
  const stats = await getUserStats(userId);

  return (
    <div>
      <h1>Dashboard</h1>
      <StatsOverview stats={stats} />
      <LinksList links={links} />
    </div>
  );
}
```

## User Data Management

### Getting User Information
```typescript
// ✅ Good: Server-side user data
import { auth, currentUser } from '@clerk/nextjs/server';

export async function getCurrentUserData() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const user = await currentUser();

  return {
    id: userId,
    email: user?.emailAddresses[0]?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
    imageUrl: user?.imageUrl,
  };
}

// ✅ Good: Client-side user data
'use client';

import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div>
      <img src={user?.imageUrl} alt="Profile" className="w-16 h-16 rounded-full" />
      <h2>{user?.firstName} {user?.lastName}</h2>
      <p>{user?.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}
```

### User Metadata
```typescript
// ✅ Good: Storing additional user data
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function updateUserPreferences(preferences: UserPreferences) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      ...preferences,
    },
  });
}

// ✅ Good: Retrieving user metadata
export async function getUserPreferences() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await clerkClient.users.getUser(userId);

  return user.publicMetadata as UserPreferences | null;
}
```

## Custom Sign-In/Sign-Up Flows

### Custom Sign-In Component
```tsx
// components/CustomSignIn.tsx
'use client';

import { useSignIn } from '@clerk/nextjs';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CustomSignIn() {
  const { signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn?.create({
        identifier: email,
        password,
      });

      if (result?.status === 'complete') {
        await setActive?.({ session: result.createdSessionId });
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

## Role-Based Access Control

### Organization Permissions
```typescript
// ✅ Good: Organization-based access
import { auth } from '@clerk/nextjs/server';

export async function requireOrganizationAccess(orgId: string) {
  const { userId, orgRole } = await auth();

  if (!userId) {
    throw new Error('Authentication required');
  }

  if (!orgRole || orgRole !== 'admin') {
    throw new Error('Admin access required');
  }

  // Verify user belongs to the organization
  const organizations = await clerkClient.users.getUser(userId).then(user =>
    user.organizationMemberships
  );

  const hasAccess = organizations?.some(org => org.id === orgId);

  if (!hasAccess) {
    throw new Error('Organization access denied');
  }
}
```

### Custom Claims and Permissions
```typescript
// middleware.ts with custom claims
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect((has) => {
      return has({ role: 'admin' }) || has({ permission: 'admin:access' });
    });
  }
});
```

## Webhooks and Events

### Webhook Handling
```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    // Handle user creation
    await createUserProfile(id);
  } else if (eventType === 'user.deleted') {
    // Handle user deletion
    await deleteUserData(id);
  }

  return new Response('', { status: 200 });
}
```

## Security Best Practices

### Token Management
```typescript
// ✅ Good: Secure token handling
import { auth } from '@clerk/nextjs/server';

export async function getAuthToken() {
  const { getToken } = await auth();

  // Get token with appropriate permissions
  const token = await getToken({
    template: 'your-template-name', // Optional: for custom claims
  });

  return token;
}
```

### Session Management
```typescript
// ✅ Good: Session validation
'use client';

import { useAuth } from '@clerk/nextjs';

export function ProtectedContent() {
  const { isLoaded, userId, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn || !userId) {
    return <div>Please sign in to access this content.</div>;
  }

  return <div>Protected content here</div>;
}
```

### Error Handling
```typescript
// ✅ Good: Authentication error handling
'use client';

import { useSignIn } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';

export function SignInForm() {
  const { signIn } = useSignIn();

  const handleSubmit = async (formData: FormData) => {
    try {
      await signIn?.create({
        identifier: formData.get('email') as string,
        password: formData.get('password') as string,
      });
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        // Handle Clerk-specific errors
        console.error('Clerk error:', error.errors);
      } else {
        // Handle other errors
        console.error('Unexpected error:', error);
      }
    }
  };

  // ... form JSX
}
```