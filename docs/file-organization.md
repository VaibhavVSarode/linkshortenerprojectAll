# File Organization and Naming Patterns

## Directory Structure

### Root Level Structure
```
linkshortenerproject/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route groups
│   ├── (dashboard)/
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Global loading
│   ├── page.tsx                  # Home page
│   └── not-found.tsx             # 404 page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components
│   └── shared/                   # Shared components
├── db/                           # Database related
│   ├── index.ts                  # Database connection
│   └── schema.ts                 # Database schema
├── lib/                          # Utility libraries
│   ├── utils.ts                  # General utilities
│   ├── validations.ts            # Validation schemas
│   └── constants.ts              # App constants
├── hooks/                        # Custom React hooks
│   ├── use-links.ts
│   └── use-auth.ts
├── types/                        # TypeScript type definitions
│   ├── index.ts
│   └── api.ts
└── public/                       # Static assets
    ├── favicon.ico
    └── images/
```

### Feature-Based Organization
```
app/
├── dashboard/
│   ├── page.tsx
│   ├── layout.tsx
│   └── loading.tsx
└── links/
    ├── page.tsx
    ├── create/
    │   └── page.tsx
    └── [id]/
        ├── page.tsx
        ├── edit/
        │   └── page.tsx
        └── analytics/
            └── page.tsx
```

## Naming Conventions

### Files and Directories

#### Components
```typescript
// ✅ Good: PascalCase for component files
components/
├── Button.tsx                    // Basic UI component
├── LinkCard.tsx                  // Feature component
├── CreateLinkForm.tsx            // Form component
├── DashboardLayout.tsx           // Layout component
└── LoadingSpinner.tsx            // Shared component
```

#### Utilities and Libraries
```typescript
// ✅ Good: kebab-case for utility files
lib/
├── utils.ts                      // General utilities
├── date-utils.ts                 // Date utilities
├── api-client.ts                 // API client
└── validation-schemas.ts         // Validation schemas
```

#### Hooks
```typescript
// ✅ Good: use- prefix for custom hooks
hooks/
├── use-links.ts
├── use-auth.ts
├── use-local-storage.ts
└── use-debounce.ts
```

#### Types
```typescript
// ✅ Good: Descriptive names for type files
types/
├── link.ts                       // Link-related types
├── user.ts                       // User-related types
├── api.ts                        // API-related types
└── index.ts                      // Barrel export
```

#### API Routes
```typescript
// ✅ Good: RESTful naming for API routes
app/api/
├── links/
│   ├── route.ts                  // GET /api/links, POST /api/links
│   └── [id]/
│       └── route.ts              // GET /api/links/[id], PUT /api/links/[id], DELETE /api/links/[id]
├── analytics/
│   └── route.ts
└── auth/
    └── callback/
        └── route.ts
```

### Variables and Functions

#### camelCase Convention
```typescript
// ✅ Good: camelCase for variables and functions
const userName = 'john_doe';
const isAuthenticated = true;
const createdAt = new Date();

function getUserLinks(userId: string) {
  // implementation
}

function formatDate(date: Date): string {
  // implementation
}

const handleSubmit = (data: FormData) => {
  // implementation
};
```

#### PascalCase for Types and Components
```typescript
// ✅ Good: PascalCase for types and components
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

type LinkStatus = 'active' | 'inactive' | 'expired';

function LinkCard({ link }: LinkCardProps) {
  // implementation
}

const CreateLinkButton = () => {
  // implementation
};
```

#### UPPER_SNAKE_CASE for Constants
```typescript
// ✅ Good: UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_LINKS_PER_USER = 100;
const DEFAULT_SHORT_CODE_LENGTH = 6;

const LINK_EXPIRY_DAYS = 365;
const CACHE_TTL_SECONDS = 300;
```

#### Event Handlers
```typescript
// ✅ Good: handle prefix for event handlers
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // implementation
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleLinkClick = (linkId: string) => {
  // implementation
};
```

## File Organization Patterns

### Barrel Exports
```typescript
// ✅ Good: Barrel exports for clean imports
// components/index.ts
export { Button } from './ui/button';
export { Input } from './ui/input';
export { Card, CardHeader, CardContent } from './ui/card';
export { LinkCard } from './links/LinkCard';
export { CreateLinkForm } from './forms/CreateLinkForm';

// Usage
import { Button, Input, LinkCard } from '@/components';
```

### Feature Colocation
```typescript
// ✅ Good: Keep related files together
features/links/
├── components/
│   ├── LinkCard.tsx
│   ├── LinkList.tsx
│   └── LinkForm.tsx
├── hooks/
│   ├── use-links.ts
│   └── use-link-analytics.ts
├── types/
│   └── link.ts
├── utils/
│   └── link-utils.ts
└── index.ts                      // Feature barrel export
```

### API Route Organization
```typescript
// ✅ Good: Organize API routes by feature
app/api/
├── links/
│   ├── route.ts                  // CRUD operations
│   ├── [id]/
│   │   ├── route.ts              // Single link operations
│   │   └── analytics/
│   │       └── route.ts          // Link analytics
│   └── bulk/
│       └── route.ts              // Bulk operations
└── users/
    ├── [id]/
    │   └── links/
    │       └── route.ts          // User-specific links
    └── profile/
        └── route.ts              // User profile operations
```

## Import Organization

### Import Grouping
```typescript
// ✅ Good: Group and sort imports
import { useState, useEffect } from 'react';                    // React imports
import { useRouter } from 'next/navigation';                    // Next.js imports
import { Button } from '@/components/ui/button';                // UI components
import { getLinks } from '@/lib/api';                           // Utilities
import { Link } from '@/types';                                 // Types
import type { User } from '@/types/user';                       // Type-only imports
```

### Path Aliases
```typescript
// ✅ Good: Use path aliases consistently
import { db } from '@/db';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { Link } from '@/types/link';

// ❌ Bad: Relative imports
import { db } from '../../../db';
import { cn } from '../../lib/utils';
```

### Avoid Deep Nesting
```typescript
// ✅ Good: Shallow imports with barrel exports
import { Button, Input, Card } from '@/components/ui';

// ✅ Good: Direct imports for frequently used items
import { Button } from '@/components/ui/button';

// ❌ Bad: Deep imports (unless necessary)
import { Button } from '@/components/ui/button/index';
```

## Configuration Files

### Next.js Configuration
```typescript
// ✅ Good: next.config.ts (TypeScript)
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configuration
};

export default nextConfig;
```

### TypeScript Configuration
```typescript
// ✅ Good: tsconfig.json with strict settings
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### ESLint Configuration
```javascript
// ✅ Good: eslint.config.mjs (flat config)
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);
```

### Tailwind Configuration
```javascript
// ✅ Good: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [],
};
```

## Environment Files

### Environment Variables
```bash
# ✅ Good: .env.local (not committed)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.example.com

# ✅ Good: .env.example (committed)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=your_database_url
NEXT_PUBLIC_API_URL=your_api_url
```

## Documentation Files

### README Structure
```markdown
# Link Shortener

## Overview
Brief description of the project.

## Features
- Feature 1
- Feature 2
- Feature 3

## Tech Stack
- Next.js 16
- TypeScript
- Tailwind CSS
- Drizzle ORM
- Clerk Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Development
```bash
npm run dev
```

### Building
```bash
npm run build
npm start
```

## Project Structure
Description of the main directories and their purposes.

## API Documentation
Description of API endpoints.

## Contributing
Guidelines for contributing to the project.

## License
Project license information.
```

## Testing Files

### Test File Organization
```typescript
// ✅ Good: Test files alongside implementation
components/
├── Button.tsx
├── Button.test.tsx
└── __tests__/
    └── Button.spec.tsx

// ✅ Good: Test utilities
lib/
├── __tests__/
│   ├── utils.test.ts
│   └── api.test.ts
└── test-utils/
    ├── setup.ts
    ├── mocks.ts
    └── render.tsx
```

## Migration Files

### Database Migrations
```typescript
// ✅ Good: Drizzle migration files
drizzle/
├── 001_create_users_table.sql
├── 002_create_links_table.sql
├── 003_add_click_tracking.sql
└── meta/
    ├── 001.json
    ├── 002.json
    └── 003.json
```

## Asset Organization

### Image Assets
```typescript
// ✅ Good: Organized image assets
public/
├── images/
│   ├── icons/
│   │   ├── logo.svg
│   │   └── favicon.ico
│   ├── illustrations/
│   │   ├── empty-state.svg
│   │   └── hero-image.jpg
│   └── screenshots/
│       ├── dashboard.png
│       └── mobile-view.png
```

### Font Files
```typescript
// ✅ Good: Font organization
public/
├── fonts/
│   ├── inter/
│   │   ├── Inter-Regular.woff2
│   │   ├── Inter-Medium.woff2
│   │   └── Inter-Bold.woff2
│   └── jetbrains-mono/
│       ├── JetBrainsMono-Regular.woff2
│       └── JetBrainsMono-Bold.woff2
```

## Git Ignore Patterns

### Comprehensive .gitignore
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
build/

# Production
dist/

# Environment variables
.env
.env*.local
.env.development.local
.env.test.local
.env.production.local

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite

# Logs
logs/
*.log
```

## Package.json Organization

### Script Organization
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:check": "drizzle-kit check",
    "clean": "rm -rf .next node_modules/.cache"
  }
}
```

### Dependency Organization
```json
{
  "dependencies": {
    // Core framework
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",

    // UI and styling
    "@radix-ui/react-dialog": "^1.0.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "tailwind-merge": "^2.5.4",

    // Database
    "drizzle-orm": "^0.36.4",
    "@neondatabase/serverless": "^1.0.2",

    // Authentication
    "@clerk/nextjs": "^6.9.6",

    // Utilities
    "zod": "^3.23.8"
  },
  "devDependencies": {
    // TypeScript
    "@types/node": "^22.9.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.6.3",

    // Linting and formatting
    "eslint": "^9.14.0",
    "eslint-config-next": "15.0.3",

    // Testing
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",

    // Database tooling
    "drizzle-kit": "^0.27.1",

    // Build tools
    "tailwindcss": "^3.4.14",
    "@tailwindcss/typography": "^0.5.15"
  }
}
```