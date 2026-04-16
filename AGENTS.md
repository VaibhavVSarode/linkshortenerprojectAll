<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Link Shortener Project - Agent Instructions

This document provides coding standards and conventions for the Link Shortener project. These instructions ensure consistency across the codebase and help maintain high-quality, maintainable code.

## Project Overview

This is a Next.js 16 application for creating and managing shortened URLs. Key technologies:

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Database**: Drizzle ORM with Neon PostgreSQL
- **Authentication**: Clerk
- **Icons**: Lucide React

## Documentation Structure

Comprehensive coding standards are documented in the `/docs` directory:

- **[README.md](docs/README.md)** - Overview and navigation
- **[general.md](docs/general.md)** - General project conventions and setup
- **[typescript.md](docs/typescript.md)** - TypeScript and JavaScript coding standards
- **[react-nextjs.md](docs/react-nextjs.md)** - React and Next.js specific conventions
- **[styling.md](docs/styling.md)** - Tailwind CSS and styling guidelines
- **[database.md](docs/database.md)** - Database operations with Drizzle ORM
- **[authentication.md](docs/authentication.md)** - Clerk authentication integration
- **[components.md](docs/components.md)** - Component structure and shadcn/ui usage
- **[file-organization.md](docs/file-organization.md)** - File naming and organization patterns
- **[testing.md](docs/testing.md)** - Testing conventions and practices
- **[deployment.md](docs/deployment.md)** - Build, deployment, and production considerations

## Quick Start for Agents

1. **Read the overview**: Start with [general.md](docs/general.md) for project setup and basic conventions
2. **Review core standards**: Check [typescript.md](docs/typescript.md) and [react-nextjs.md](docs/react-nextjs.md) for coding standards
3. **Component guidelines**: Refer to [components.md](docs/components.md) and [styling.md](docs/styling.md)
4. **Data operations**: Follow patterns in [database.md](docs/database.md) for database interactions
5. **Authentication**: Use guidelines from [authentication.md](docs/authentication.md) for user management

## Key Principles

- **Type Safety First**: Strict TypeScript usage throughout
- **Component Consistency**: shadcn/ui patterns with Tailwind CSS v4
- **Database Integrity**: Drizzle ORM with proper relations and constraints
- **Security**: Clerk authentication with proper authorization
- **Performance**: Optimized builds and efficient data fetching
- **Testing**: Comprehensive test coverage for reliability
- **Documentation**: Well-documented code and clear commit messages

## Development Workflow

```bash
# Setup
npm install

# Development
npm run dev

# Quality checks
npm run lint
npm run type-check
npm run test

# Production
npm run build
npm start
```

## Important Reminders

- Always follow the established patterns in the documentation
- Use the latest Next.js 16 features and APIs
- Maintain type safety with TypeScript strict mode
- Follow accessibility best practices
- Write clean, readable, and maintainable code
- Test changes thoroughly before committing
- Keep documentation updated as patterns evolve

## Getting Help

- Check the relevant documentation file for specific guidance
- Review existing code for implementation examples
- Consult team members for clarification on standards
- Update documentation when new patterns are established

Remember: These instructions are living documents. Update them as the project evolves and new patterns emerge.
