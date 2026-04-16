# Database Operations with Drizzle ORM

## Database Setup

### Connection Configuration
```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// Use connection string from environment
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### Schema Definition
```typescript
// db/schema.ts
import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (managed by Clerk, but we might reference it)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Links table
export const links = pgTable('links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  originalUrl: text('original_url').notNull(),
  shortCode: text('short_code').notNull().unique(),
  clickCount: integer('click_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Click tracking table
export const clicks = pgTable('clicks', {
  id: uuid('id').defaultRandom().primaryKey(),
  linkId: uuid('link_id').references(() => links.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
});

// Relations
export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  clicks: many(clicks),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  link: one(links, {
    fields: [clicks.linkId],
    references: [links.id],
  }),
}));
```

## Database Operations

### Creating Records
```typescript
// ✅ Good: Type-safe insert
import { db } from '@/db';
import { links } from '@/db/schema';

export async function createLink(data: {
  userId: string;
  originalUrl: string;
  shortCode: string;
}) {
  const [newLink] = await db.insert(links).values({
    userId: data.userId,
    originalUrl: data.originalUrl,
    shortCode: data.shortCode,
  }).returning();

  return newLink;
}

// ✅ Good: Batch insert
export async function createMultipleLinks(linkData: Array<{
  userId: string;
  originalUrl: string;
  shortCode: string;
}>) {
  const newLinks = await db.insert(links).values(linkData).returning();
  return newLinks;
}
```

### Reading Records
```typescript
// ✅ Good: Simple select
export async function getLinkById(id: string) {
  const [link] = await db.select().from(links).where(eq(links.id, id)).limit(1);
  return link || null;
}

// ✅ Good: Select with relations
export async function getLinkWithClicks(id: string) {
  const result = await db
    .select()
    .from(links)
    .leftJoin(clicks, eq(links.id, clicks.linkId))
    .where(eq(links.id, id));

  return result;
}

// ✅ Good: Paginated queries
export async function getUserLinks(userId: string, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const userLinks = await db
    .select()
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.createdAt))
    .limit(limit)
    .offset(offset);

  return userLinks;
}

// ✅ Good: Aggregated queries
export async function getLinkStats(userId: string) {
  const stats = await db
    .select({
      totalLinks: count(links.id),
      totalClicks: sum(links.clickCount),
      avgClicks: avg(links.clickCount),
    })
    .from(links)
    .where(eq(links.userId, userId));

  return stats[0];
}
```

### Updating Records
```typescript
// ✅ Good: Update with conditions
export async function updateLink(id: string, updates: Partial<{
  originalUrl: string;
  shortCode: string;
}>) {
  const [updatedLink] = await db
    .update(links)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(links.id, id))
    .returning();

  return updatedLink;
}

// ✅ Good: Increment counter
export async function incrementClickCount(linkId: string) {
  await db
    .update(links)
    .set({
      clickCount: sql`${links.clickCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(links.id, linkId));
}
```

### Deleting Records
```typescript
// ✅ Good: Safe delete with confirmation
export async function deleteLink(id: string, userId: string) {
  const [deletedLink] = await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.userId, userId)))
    .returning();

  return deletedLink;
}

// ✅ Good: Bulk delete
export async function deleteOldLinks(daysOld: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  await db
    .delete(links)
    .where(lt(links.createdAt, cutoffDate));
}
```

## Query Building

### Complex Queries
```typescript
// ✅ Good: Complex filtering
export async function searchLinks(userId: string, searchTerm: string) {
  return await db
    .select()
    .from(links)
    .where(and(
      eq(links.userId, userId),
      or(
        like(links.originalUrl, `%${searchTerm}%`),
        like(links.shortCode, `%${searchTerm}%`)
      )
    ))
    .orderBy(desc(links.createdAt));
}

// ✅ Good: Date range queries
export async function getLinksByDateRange(userId: string, startDate: Date, endDate: Date) {
  return await db
    .select()
    .from(links)
    .where(and(
      eq(links.userId, userId),
      gte(links.createdAt, startDate),
      lte(links.createdAt, endDate)
    ))
    .orderBy(desc(links.createdAt));
}
```

### Transactions
```typescript
// ✅ Good: Transaction for related operations
import { db } from '@/db';
import { links, clicks } from '@/db/schema';

export async function createLinkWithInitialClick(data: {
  userId: string;
  originalUrl: string;
  shortCode: string;
  initialClickData?: {
    ipAddress: string;
    userAgent: string;
  };
}) {
  return await db.transaction(async (tx) => {
    // Create the link
    const [newLink] = await tx.insert(links).values({
      userId: data.userId,
      originalUrl: data.originalUrl,
      shortCode: data.shortCode,
    }).returning();

    // Record initial click if provided
    if (data.initialClickData) {
      await tx.insert(clicks).values({
        linkId: newLink.id,
        ipAddress: data.initialClickData.ipAddress,
        userAgent: data.initialClickData.userAgent,
      });

      // Update click count
      await tx
        .update(links)
        .set({ clickCount: 1 })
        .where(eq(links.id, newLink.id));
    }

    return newLink;
  });
}
```

## Migrations

### Migration Setup
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Running Migrations
```bash
# Generate migration
npx drizzle-kit generate

# Push changes (development)
npx drizzle-kit push

# Check migration status
npx drizzle-kit check
```

### Migration Files
```sql
-- Example migration file
-- 001_create_links_table.sql
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  click_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_short_code ON links(short_code);
CREATE INDEX idx_links_created_at ON links(created_at);
```

## Performance Optimization

### Indexing Strategy
```typescript
// ✅ Good: Indexes for common queries
// In schema definition, Drizzle will create appropriate indexes

// Additional indexes for performance
CREATE INDEX CONCURRENTLY idx_links_user_created ON links(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_clicks_link_clicked ON clicks(link_id, clicked_at DESC);
CREATE INDEX CONCURRENTLY idx_clicks_clicked_at ON clicks(clicked_at DESC);
```

### Query Optimization
```typescript
// ✅ Good: Select only needed columns
export async function getLinkSummaries(userId: string) {
  return await db
    .select({
      id: links.id,
      shortCode: links.shortCode,
      originalUrl: links.originalUrl,
      clickCount: links.clickCount,
      createdAt: links.createdAt,
    })
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.createdAt));
}

// ✅ Good: Use EXISTS for existence checks
export async function linkExists(shortCode: string): Promise<boolean> {
  const result = await db
    .select({ exists: sql`1` })
    .from(links)
    .where(eq(links.shortCode, shortCode))
    .limit(1);

  return result.length > 0;
}
```

## Error Handling

### Database Error Handling
```typescript
// ✅ Good: Handle database errors gracefully
export async function safeCreateLink(data: CreateLinkInput) {
  try {
    const newLink = await createLink(data);
    return { success: true, data: newLink };
  } catch (error) {
    console.error('Failed to create link:', error);

    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return {
        success: false,
        error: 'A link with this short code already exists'
      };
    }

    if (error.code === '23503') { // Foreign key violation
      return {
        success: false,
        error: 'Invalid user ID'
      };
    }

    return {
      success: false,
      error: 'Failed to create link. Please try again.'
    };
  }
}
```

## Data Validation

### Schema Validation
```typescript
// ✅ Good: Runtime validation with Zod
import { z } from 'zod';

const createLinkSchema = z.object({
  originalUrl: z.string().url('Invalid URL format'),
  shortCode: z.string()
    .min(3, 'Short code must be at least 3 characters')
    .max(20, 'Short code must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Short code can only contain letters, numbers, hyphens, and underscores'),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

export async function validateAndCreateLink(input: unknown) {
  const validatedData = createLinkSchema.parse(input);
  return await createLink(validatedData);
}
```

## Connection Management

### Connection Pooling
```typescript
// ✅ Good: Connection pooling with Neon
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum pool size
});

export const db = drizzle(pool);
```

### Connection Cleanup
```typescript
// ✅ Good: Proper connection cleanup
import { db } from '@/db';

export async function cleanup() {
  await db.$client.end();
}

// In Next.js API routes, connections are managed automatically
// For long-running processes, ensure cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
```