# General Project Conventions

## Project Setup

### Dependencies
- Use the exact versions specified in `package.json`
- Only add new dependencies after team discussion
- Prefer lightweight, well-maintained packages
- Use TypeScript types for all packages (`@types/*`)

### Environment Variables
- Store sensitive data in `.env.local` (not committed)
- Use `process.env.VARIABLE_NAME` for server-side access
- Prefix client-side env vars with `NEXT_PUBLIC_`
- Document all required environment variables in README

### Development Workflow
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Code Quality Standards

### General Principles
- Write self-documenting code with clear variable/function names
- Keep functions small and focused (single responsibility)
- Use early returns to reduce nesting
- Prefer const over let, avoid var
- Use meaningful comments for complex logic
- Follow DRY (Don't Repeat Yourself) principle

### Error Handling
- Use try-catch blocks for async operations
- Provide meaningful error messages
- Handle edge cases gracefully
- Log errors appropriately (not to console in production)

### Performance Considerations
- Optimize images and assets
- Use Next.js Image component for images
- Implement proper loading states
- Avoid unnecessary re-renders
- Use React.memo for expensive components when needed

### Security
- Validate all user inputs
- Use HTTPS in production
- Implement proper authentication checks
- Sanitize data before database operations
- Follow OWASP security guidelines

## Git and Version Control

### Commit Messages
- Use conventional commits format
- Start with type: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Keep messages concise but descriptive
- Reference issue numbers when applicable

### Branching Strategy
- Use feature branches for new features
- Use bugfix branches for bug fixes
- Follow `feature/description` or `bugfix/description` naming
- Merge via pull requests with code review

## Code Review Guidelines

### What to Check
- Code follows established patterns and conventions
- TypeScript types are correct and complete
- No console.log statements in production code
- Proper error handling
- Tests are included for new features
- Performance implications are considered
- Security best practices are followed

### Review Process
- Be constructive and respectful
- Explain reasoning for requested changes
- Suggest improvements, don't dictate
- Approve only when confident in the code quality