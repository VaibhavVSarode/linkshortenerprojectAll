# TypeScript and JavaScript Conventions

## TypeScript Configuration

### Compiler Options
- **Strict mode**: Always enabled for type safety
- **Target**: ES2017 for modern browser support
- **Module resolution**: bundler (Next.js default)
- **JSX**: react-jsx (automatic JSX transform)
- **Path aliases**: Use `@/*` for imports from project root

### Type Definitions
```typescript
// ✅ Good: Explicit types
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// ✅ Good: Union types for constrained values
type UserRole = 'admin' | 'user' | 'moderator';

// ✅ Good: Generic types
interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

// ❌ Bad: any type usage
const user: any = { id: 1, name: 'John' };

// ❌ Bad: Implicit any
function processData(data) { // Missing parameter type
  return data;
}
```

## Variable and Function Declarations

### Naming Conventions
- **Variables**: camelCase (`userName`, `isActive`)
- **Functions**: camelCase (`getUserData`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse`)
- **Enums**: PascalCase (`UserStatus`, `HttpMethod`)
- **Files**: kebab-case (`user-profile.tsx`, `api-utils.ts`)

### Declaration Preferences
```typescript
// ✅ Prefer const for immutable values
const API_BASE_URL = 'https://api.example.com';

// ✅ Use let only when reassignment is needed
let currentUser = null;
currentUser = await fetchUser();

// ❌ Avoid var
var oldStyle = 'deprecated';

// ✅ Use const for function declarations
const handleSubmit = (data: FormData) => {
  // implementation
};

// ✅ Prefer arrow functions for consistency
const formatDate = (date: Date): string => {
  return date.toISOString();
};
```

## Type Safety

### Strict Typing
- Avoid `any` type - use proper types or `unknown`
- Use union types for multiple possible values
- Leverage TypeScript's type inference
- Define interfaces for complex objects

```typescript
// ✅ Good: Proper typing
interface Link {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clickCount: number;
}

const createLink = (data: Omit<Link, 'id' | 'createdAt' | 'clickCount'>): Promise<Link> => {
  // implementation
};

// ✅ Good: Discriminated unions
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const handleApiCall = async (): Promise<ApiResult<User>> => {
  try {
    const user = await api.getUser();
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Null Safety
- Use strict null checks
- Prefer optional chaining (`?.`)
- Use nullish coalescing (`??`)
- Avoid `!` non-null assertion unless absolutely certain

```typescript
// ✅ Good: Safe property access
const userName = user?.profile?.name ?? 'Anonymous';

// ✅ Good: Optional parameters
const updateUser = (id: string, updates: Partial<User>) => {
  // implementation
};

// ❌ Bad: Dangerous non-null assertion
const name = user!.name; // Can cause runtime errors
```

## Import/Export Patterns

### Import Organization
```typescript
// ✅ Group imports by type, then alphabetically
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types/user';

// ✅ Use path aliases
import { db } from '@/db';
import { auth } from '@/lib/auth';

// ❌ Don't mix default and named imports unnecessarily
import React, { useState } from 'react'; // React is not needed in modern React
```

### Export Patterns
```typescript
// ✅ Named exports preferred
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

export interface LinkStats {
  totalClicks: number;
  uniqueVisitors: number;
}

// ✅ Default export for main component
const LinkShortener = () => { /* ... */ };
export default LinkShortener;

// ✅ Barrel exports in index files
export { Button } from './button';
export { Input } from './input';
export type { ButtonProps } from './button';
```

## Error Handling

### Async Operations
```typescript
// ✅ Proper async/await with error handling
const fetchUserLinks = async (userId: string): Promise<Link[]> => {
  try {
    const response = await fetch(`/api/users/${userId}/links`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user links:', error);
    throw new Error('Unable to load links. Please try again.');
  }
};

// ✅ Type-safe error handling
const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
```

## Utility Types and Patterns

### Common Utility Types
```typescript
// Predefined utility types
type CreateLinkInput = Omit<Link, 'id' | 'createdAt' | 'clickCount'>;
type UpdateLinkInput = Partial<Pick<Link, 'originalUrl'>>;
type LinkResponse = Pick<Link, 'id' | 'shortCode' | 'originalUrl'>;

// Custom utility types
type Nullable<T> = T | null;
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

### Type Guards
```typescript
// ✅ Type guards for runtime type checking
const isLink = (obj: unknown): obj is Link => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'originalUrl' in obj &&
    'shortCode' in obj
  );
};

// Usage
const processData = (data: unknown) => {
  if (isLink(data)) {
    console.log(data.shortCode); // TypeScript knows this is a Link
  }
};
```