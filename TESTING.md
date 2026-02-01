# Testing Framework Documentation

## Overview

This repository includes comprehensive testing frameworks for all components:

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: Playwright cross-browser testing
- **CI/CD**: GitHub Actions automated testing

## Frontend Testing

### Unit Tests (Jest)

Located in `frontend/__tests__/`

**Run Tests:**
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test Navigation.test.tsx
```

**Configuration:**
- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Test environment setup
- `__mocks__/` - Mock files for styles and assets

**Coverage Thresholds:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### E2E Tests (Playwright)

Located in `frontend/e2e/`

**Run Tests:**
```bash
cd frontend

# Install browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific browser
npx playwright test --project=chromium

# Run specific test file
npx playwright test dashboard.spec.ts

# Debug mode with UI
npx playwright test --debug

# Show test report
npx playwright show-report
```

**Test Coverage:**
- Desktop browsers: Chrome, Firefox, Safari, Edge
- Mobile browsers: Chrome Mobile, Safari Mobile
- Accessibility testing
- Keyboard navigation
- Responsive design validation

### Adding New Tests

**Unit Test Example:**
```typescript
// __tests__/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**E2E Test Example:**
```typescript
// e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test('feature works correctly', async ({ page }) => {
  await page.goto('/feature');
  await expect(page.getByRole('heading')).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions

Workflow file: `.github/workflows/frontend-tests.yml`

**Triggered on:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Changes in `frontend/**` directory

**Jobs:**
1. **Unit Tests** - Runs on Node 18.x and 20.x
2. **E2E Tests** - Cross-browser testing
3. **Lint** - ESLint and TypeScript checking
4. **Build** - Production build validation

**Artifacts:**
- Coverage reports (uploaded to Codecov)
- Playwright test reports
- Test videos (on failure)

### Running CI Locally

```bash
# Install Act (GitHub Actions local runner)
# Windows: choco install act
# Mac: brew install act

# Run all workflows
act

# Run specific job
act -j unit-tests
```

## Test Organization

### Directory Structure
```
frontend/
├── __tests__/              # Unit tests
│   ├── components/         # Component tests
│   ├── lib/               # Utility tests
│   └── app/               # Page tests
├── __mocks__/             # Mock files
│   ├── styleMock.js       # CSS mock
│   └── fileMock.js        # Asset mock
├── e2e/                   # E2E tests
│   ├── dashboard.spec.ts
│   ├── navigation.spec.ts
│   └── accessibility.spec.ts
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Test environment
└── playwright.config.ts   # Playwright configuration
```

## Best Practices

### Unit Tests
1. Test user behavior, not implementation
2. Use Testing Library queries (getByRole, getByText)
3. Mock external dependencies
4. Keep tests isolated and independent
5. Test accessibility (ARIA roles, labels)

### E2E Tests
1. Test critical user journeys
2. Use data-testid sparingly (prefer semantic selectors)
3. Wait for elements (auto-waiting in Playwright)
4. Test across browsers and devices
5. Keep tests fast and reliable

### Coverage
1. Aim for >70% coverage
2. Focus on critical paths
3. Don't test third-party libraries
4. Exclude generated files (.next/, dist/)

## Debugging

### Jest Debugging
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# VSCode launch configuration
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Playwright Debugging
```bash
# UI mode (recommended)
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

## Common Issues

### Jest Issues

**Problem**: Tests fail with module not found
```bash
# Solution: Check moduleNameMapper in jest.config.js
# Ensure path aliases match tsconfig.json
```

**Problem**: Mock not working
```bash
# Solution: Place mocks in __mocks__/ directory
# Use jest.mock() before imports
```

### Playwright Issues

**Problem**: Browser not installed
```bash
# Solution: Install browsers
npx playwright install
```

**Problem**: Test timeout
```bash
# Solution: Increase timeout in playwright.config.ts
timeout: 60000 // 60 seconds
```

## Performance

### Optimizing Test Speed

1. **Parallel Execution**: Jest runs tests in parallel by default
2. **Selective Testing**: Use `.only()` during development
3. **Shared Contexts**: Use beforeAll for expensive setup
4. **Mock External APIs**: Don't hit real endpoints
5. **CI Caching**: Cache node_modules and Playwright browsers

### Test Metrics

Monitor in CI:
- Total test duration
- Flaky test rate
- Coverage trends
- Build size changes

## Integration with AI-Med-Agent

### Backend API Testing

```typescript
// Mock API responses
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/decisions', (req, res, ctx) => {
    return res(ctx.json({ decisions: [] }));
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());
```

### Autonomous Agent Testing

Test decision-making logic:
```typescript
describe('Autonomous Decision Engine', () => {
  it('recommends correct action', () => {
    const decision = engine.analyze(mockData);
    expect(decision.action).toBe('approve');
    expect(decision.confidence).toBeGreaterThan(0.8);
  });
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Updates

Keep testing dependencies updated:
```bash
npm update @testing-library/react @testing-library/jest-dom
npm update @playwright/test
npm update jest
```

Check for security vulnerabilities:
```bash
npm audit
npm audit fix
```
