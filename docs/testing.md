# Testing Conventions and Practices

## Testing Setup

### Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

### Test Setup File
```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test utilities
global.fetch = jest.fn();
```

### Testing Dependencies
```json
{
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.2",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "msw": "^2.4.9"
  }
}
```

## Testing Patterns

### Component Testing
```tsx
// ✅ Good: Component test structure
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkCard } from '@/components/LinkCard';

// Mock data
const mockLink = {
  id: '1',
  shortCode: 'abc123',
  originalUrl: 'https://example.com',
  clickCount: 42,
  createdAt: new Date('2024-01-01'),
};

describe('LinkCard', () => {
  it('renders link information correctly', () => {
    render(<LinkCard link={mockLink} />);

    expect(screen.getByText('abc123')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('42 clicks')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const mockOnDelete = jest.fn();
    const user = userEvent.setup();

    render(<LinkCard link={mockLink} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Check if confirmation dialog appears
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('shows edit button when onEdit is provided', () => {
    const mockOnEdit = jest.fn();
    render(<LinkCard link={mockLink} onEdit={mockOnEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });
});
```

### Form Testing
```tsx
// ✅ Good: Form component testing
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateLinkForm } from '@/components/CreateLinkForm';

describe('CreateLinkForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<CreateLinkForm onSubmit={mockOnSubmit} />);

    const urlInput = screen.getByLabelText(/original url/i);
    const submitButton = screen.getByRole('button', { name: /create link/i });

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        originalUrl: 'https://example.com',
        customCode: '',
      });
    });
  });

  it('shows validation error for invalid URL', async () => {
    const user = userEvent.setup();
    render(<CreateLinkForm onSubmit={mockOnSubmit} />);

    const urlInput = screen.getByLabelText(/original url/i);
    const submitButton = screen.getByRole('button', { name: /create link/i });

    await user.type(urlInput, 'invalid-url');
    await user.click(submitButton);

    expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid custom code', async () => {
    const user = userEvent.setup();
    render(<CreateLinkForm onSubmit={mockOnSubmit} />);

    const urlInput = screen.getByLabelText(/original url/i);
    const codeInput = screen.getByLabelText(/custom code/i);
    const submitButton = screen.getByRole('button', { name: /create link/i });

    await user.type(urlInput, 'https://example.com');
    await user.type(codeInput, 'invalid code!');
    await user.click(submitButton);

    expect(screen.getByText(/custom code can only contain/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
```

### Custom Hook Testing
```tsx
// ✅ Good: Custom hook testing
import { renderHook, waitFor } from '@testing-library/react';
import { useLinks } from '@/hooks/use-links';

// Mock the API
jest.mock('@/lib/api', () => ({
  getLinks: jest.fn(),
}));

import { getLinks } from '@/lib/api';

const mockGetLinks = getLinks as jest.MockedFunction<typeof getLinks>;

describe('useLinks', () => {
  beforeEach(() => {
    mockGetLinks.mockClear();
  });

  it('fetches links on mount', async () => {
    const mockLinks = [
      { id: '1', shortCode: 'abc', originalUrl: 'https://example.com' },
    ];

    mockGetLinks.mockResolvedValue(mockLinks);

    const { result } = renderHook(() => useLinks());

    expect(result.current.loading).toBe(true);
    expect(result.current.links).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.links).toEqual(mockLinks);
    });

    expect(mockGetLinks).toHaveBeenCalledTimes(1);
  });

  it('handles API errors', async () => {
    const errorMessage = 'Failed to fetch links';
    mockGetLinks.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useLinks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.links).toEqual([]);
    });
  });
});
```

## API Route Testing

### API Route Testing
```typescript
// ✅ Good: API route testing
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/links/route';
import { db } from '@/db';

// Mock the database
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('/api/links', () => {
  beforeEach(() => {
    mockDb.select.mockClear();
    mockDb.insert.mockClear();
  });

  describe('GET', () => {
    it('returns links for authenticated user', async () => {
      const mockLinks = [
        { id: '1', shortCode: 'abc', originalUrl: 'https://example.com' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockLinks),
        }),
      });

      // Mock auth
      jest.mock('@clerk/nextjs/server', () => ({
        auth: jest.fn().mockResolvedValue({ userId: 'user-123' }),
      }));

      const request = new NextRequest('http://localhost:3000/api/links');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockLinks);
    });

    it('returns 401 for unauthenticated requests', async () => {
      jest.mock('@clerk/nextjs/server', () => ({
        auth: jest.fn().mockResolvedValue({ userId: null }),
      }));

      const request = new NextRequest('http://localhost:3000/api/links');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST', () => {
    it('creates a new link', async () => {
      const newLink = {
        id: '1',
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        userId: 'user-123',
        clickCount: 0,
        createdAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newLink]),
        }),
      });

      jest.mock('@clerk/nextjs/server', () => ({
        auth: jest.fn().mockResolvedValue({ userId: 'user-123' }),
      }));

      const request = new NextRequest('http://localhost:3000/api/links', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: 'https://example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(newLink);
    });
  });
});
```

## Database Testing

### Database Operation Testing
```typescript
// ✅ Good: Database operation testing
import { createLink, getLinkById } from '@/lib/db/links';
import { db } from '@/db';

jest.mock('@/db');

const mockDb = db as jest.Mocked<typeof db>;

describe('links database operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLink', () => {
    it('creates a link successfully', async () => {
      const linkData = {
        userId: 'user-123',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
      };

      const expectedLink = {
        id: '1',
        ...linkData,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([expectedLink]),
        }),
      });

      const result = await createLink(linkData);

      expect(result).toEqual(expectedLink);
      expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Function));
    });

    it('handles database errors', async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(createLink({
        userId: 'user-123',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
      })).rejects.toThrow('Database connection failed');
    });
  });

  describe('getLinkById', () => {
    it('returns link when found', async () => {
      const mockLink = {
        id: '1',
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockLink]),
          }),
        }),
      });

      const result = await getLinkById('1');

      expect(result).toEqual(mockLink);
    });

    it('returns null when link not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await getLinkById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
```

## Mocking and Test Utilities

### API Mocking with MSW
```typescript
// __mocks__/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/links', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          shortCode: 'abc123',
          originalUrl: 'https://example.com',
          clickCount: 42,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ])
    );
  }),

  rest.post('/api/links', async (req, res, ctx) => {
    const { originalUrl, customCode } = await req.json();

    return res(
      ctx.status(201),
      ctx.json({
        id: '2',
        shortCode: customCode || 'def456',
        originalUrl,
        clickCount: 0,
        createdAt: new Date().toISOString(),
      })
    );
  }),
];
```

### Test Utilities
```typescript
// lib/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    // Add any providers here (theme, auth, etc.)
    {children}
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockLink = (overrides = {}) => ({
  id: '1',
  shortCode: 'abc123',
  originalUrl: 'https://example.com',
  clickCount: 42,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  ...overrides,
});
```

## Test Organization

### Test File Structure
```
__tests__/
├── unit/
│   ├── components/
│   │   ├── LinkCard.test.tsx
│   │   └── CreateLinkForm.test.tsx
│   ├── hooks/
│   │   └── use-links.test.ts
│   └── utils/
│       └── format-date.test.ts
├── integration/
│   ├── api/
│   │   └── links-api.test.ts
│   └── pages/
│       └── dashboard.test.tsx
└── e2e/
    ├── auth-flow.spec.ts
    └── link-creation.spec.ts
```

### Test Categories
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test how different parts work together
- **E2E Tests**: Test complete user workflows

## Testing Best Practices

### Test Naming
```typescript
// ✅ Good: Descriptive test names
describe('LinkCard Component', () => {
  it('displays the short code and original URL', () => {
    // test implementation
  });

  it('shows the click count when provided', () => {
    // test implementation
  });

  it('calls onDelete when the delete button is clicked and confirmed', () => {
    // test implementation
  });
});
```

### Test Coverage
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Test Data Management
```typescript
// ✅ Good: Consistent test data
const mockLinks = [
  {
    id: '1',
    shortCode: 'abc123',
    originalUrl: 'https://example.com',
    clickCount: 42,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    shortCode: 'def456',
    originalUrl: 'https://google.com',
    clickCount: 15,
    createdAt: new Date('2024-01-02'),
  },
];

// Use in tests
describe('LinkList', () => {
  it('renders all links', () => {
    render(<LinkList links={mockLinks} />);
    // assertions
  });
});
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Performance Testing

### Component Performance Tests
```typescript
// ✅ Good: Performance testing
import { render } from '@testing-library/react';
import { LinkList } from '@/components/LinkList';

describe('LinkList Performance', () => {
  it('renders large list efficiently', () => {
    const largeLinkList = Array.from({ length: 1000 }, (_, i) => ({
      id: `link-${i}`,
      shortCode: `code${i}`,
      originalUrl: `https://example${i}.com`,
      clickCount: Math.floor(Math.random() * 100),
      createdAt: new Date(),
    }));

    const startTime = performance.now();
    render(<LinkList links={largeLinkList} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
  });
});
```

## Accessibility Testing

### A11y Testing
```typescript
// ✅ Good: Accessibility testing
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('LinkCard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<LinkCard link={mockLink} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(<LinkCard link={mockLink} />);
    expect(screen.getByLabelText(/delete link/i)).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<LinkCard link={mockLink} onDelete={jest.fn()} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.tab();
    expect(deleteButton).toHaveFocus();
  });
});
```