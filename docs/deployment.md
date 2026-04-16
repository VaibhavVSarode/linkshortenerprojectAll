# Deployment and Production Guidelines

## Build Configuration

### Next.js Build Optimization
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable SWC minification
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Compression
  compress: true,

  // Output optimization
  output: 'standalone', // For Docker deployments

  // Experimental features (Next.js 16)
  experimental: {
    // Enable app directory features
    appDir: true,

    // Optimize CSS
    optimizeCss: true,

    // Webpack build worker
    webpackBuildWorker: true,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Environment Variables for Production
```bash
# .env.production
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID

# Redis (for caching)
REDIS_URL=redis://host:6379

# Email service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Database Production Setup

### Connection Optimization
```typescript
// db/index.ts (production)
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';

// Configure connection pooling for production
neonConfig.poolSize = 10;
neonConfig.poolIdleTimeout = 30000;

const sql = neon(process.env.DATABASE_URL!);

// Use connection pooling in production
export const db = drizzle(sql);
```

### Database Migrations
```bash
# Production deployment script
#!/bin/bash

# Generate migrations
npm run db:generate

# Run migrations (if using a migration tool)
npm run db:migrate

# Push schema changes (for development/testing only)
# npm run db:push
```

### Database Backup Strategy
```bash
# Backup script
#!/bin/bash

# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to cloud storage (AWS S3, etc.)
aws s3 cp backup_*.sql s3://your-backup-bucket/

# Clean up old backups (keep last 7 days)
find . -name "backup_*.sql" -mtime +7 -delete
```

## Deployment Platforms

### Vercel Deployment
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache"
        }
      ]
    }
  ]
}
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --production=false; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose for Local Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/linkshortener
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=linkshortener
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Performance Optimization

### Caching Strategies
```typescript
// app/api/links/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Cache for 5 minutes
  const response = NextResponse.json(links);
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  return response;
}

// Redis caching for frequently accessed data
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export async function getCachedLinks(userId: string) {
  const cacheKey = `links:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const links = await db.select().from(linksTable).where(eq(linksTable.userId, userId));

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(links));

  return links;
}
```

### Image Optimization
```tsx
// lib/image-loader.ts
export default function customImageLoader({ src, width, quality }: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Use a custom image CDN
  return `https://images.yourcdn.com/${src}?w=${width}&q=${quality || 75}`;
}

// Usage in components
import Image from 'next/image';
import customImageLoader from '@/lib/image-loader';

<Image
  loader={customImageLoader}
  src="/hero-image.jpg"
  alt="Hero"
  width={800}
  height={600}
  priority
/>
```

### Bundle Analysis
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Your Next.js config
});
```

```bash
# Analyze bundle
ANALYZE=true npm run build
```

## Monitoring and Logging

### Error Tracking
```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

export function initErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });
  }
}

// In app/layout.tsx
import { initErrorTracking } from '@/lib/error-tracking';

initErrorTracking();
```

### Performance Monitoring
```typescript
// lib/performance.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  const start = performance.now();

  return fn().finally(() => {
    const duration = performance.now() - start;
    console.log(`${name} took ${duration.toFixed(2)}ms`);

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to DataDog, New Relic, etc.
    }
  });
}

// Usage
await measurePerformance('createLink', () => createLink(data));
```

### Logging
```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (CloudWatch, DataDog, etc.)
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
    }
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }
}

export const logger = new Logger();
```

## Security Hardening

### API Security
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isApiRoute = createRouteMatcher(['/api/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  const rateLimitKey = `rate-limit:${ip}`;

  // Implement rate limiting logic here

  // CORS headers
  if (isApiRoute(req)) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }
});
```

### Content Security Policy
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://api.clerk.dev https://*.clerk.dev",
              "frame-src 'self' https://*.clerk.dev",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

## Health Checks and Monitoring

### Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

### Application Monitoring
```typescript
// lib/monitoring.ts
import { logger } from './logger';

export function setupMonitoring() {
  // Process monitoring
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
  });

  // Memory monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    logger.info('Memory Usage', {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    });
  }, 300000); // Every 5 minutes
}
```

## Backup and Recovery

### Automated Backups
```bash
# backup.sh
#!/bin/bash

# Database backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://your-backup-bucket/

# Clean up local files
rm ${BACKUP_FILE}.gz

# Keep only last 30 days in S3
aws s3api list-objects-v2 --bucket your-backup-bucket --prefix backup_ | \
  jq -r '.Contents[]?.Key' | \
  sort | \
  head -n -30 | \
  xargs -I {} aws s3 rm s3://your-backup-bucket/{}
```

### Disaster Recovery Plan
1. **Regular Backups**: Daily database backups stored in multiple locations
2. **Infrastructure as Code**: All infrastructure defined in code for quick recreation
3. **Monitoring Alerts**: Immediate notifications for service outages
4. **Rollback Strategy**: Ability to quickly rollback to previous versions
5. **Data Recovery**: Process for restoring data from backups
6. **Communication Plan**: Stakeholder notification procedures

## Scaling Considerations

### Horizontal Scaling
```typescript
// Load balancing configuration
// Use a load balancer (ALB, NGINX) to distribute traffic

// Session affinity for Clerk
// Configure load balancer to maintain session affinity if needed

// Database connection pooling
// Already configured with Neon connection pooling
```

### CDN Integration
```typescript
// next.config.ts
const nextConfig = {
  images: {
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/your-account/image/upload/',
  },
};
```

### Caching Layers
1. **Browser Cache**: HTTP caching headers
2. **CDN Cache**: Cloudflare, AWS CloudFront
3. **Application Cache**: Redis for session data
4. **Database Cache**: Query result caching

## Compliance and Privacy

### GDPR Compliance
```typescript
// Data deletion endpoint
export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete all user data
  await deleteUserData(userId);

  // Log deletion for compliance
  logger.info('User data deleted', { userId });

  return NextResponse.json({ message: 'Data deleted successfully' });
}
```

### Data Retention Policy
- User data retained for 7 years (legal requirement)
- Analytics data retained for 2 years
- Automatic deletion of expired data
- User-initiated data deletion available

## Maintenance Tasks

### Cron Jobs
```typescript
// lib/cron.ts
import cron from 'node-cron';

// Clean up expired links daily
cron.schedule('0 2 * * *', async () => {
  logger.info('Starting expired links cleanup');

  try {
    const deletedCount = await cleanupExpiredLinks();
    logger.info('Expired links cleanup completed', { deletedCount });
  } catch (error) {
    logger.error('Expired links cleanup failed', { error });
  }
});

// Generate analytics reports weekly
cron.schedule('0 3 * * 1', async () => {
  logger.info('Generating weekly analytics report');

  try {
    await generateAnalyticsReport();
    logger.info('Weekly analytics report generated');
  } catch (error) {
    logger.error('Weekly analytics report failed', { error });
  }
});
```

### Database Maintenance
```sql
-- Regular maintenance queries
-- Analyze tables for query optimization
ANALYZE links;

-- Vacuum for space reclamation
VACUUM (ANALYZE) links;

-- Reindex for performance
REINDEX TABLE links;
```

This completes the agent instructions documentation. The files are now created in the `/docs` directory and provide comprehensive guidance for maintaining consistency and quality in the Link Shortener project.