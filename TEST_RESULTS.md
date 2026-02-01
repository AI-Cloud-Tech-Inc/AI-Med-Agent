# Test Results Documentation

## Overview
Comprehensive test results and logging for AI-Med-Agent and AI-Film-Studio applications.

## Test Environment

### Configuration Files
- `.env.test` - Test environment variables
- `jest.config.js` - Unit test configuration
- `playwright.config.ts` - E2E test configuration

### Test Data
- Mock data fixtures in `/lib/test-fixtures.ts`
- Test utilities in `/lib/test-logger.ts`

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npm test -- DecisionTable.unit.test.tsx
```

### Integration Tests
```bash
# Run integration tests only
npm run test:integration

# With coverage
npm run test:integration -- --coverage
```

### E2E Tests
```bash
# Install browsers (first time only)
npm run playwright:install

# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# UI mode (interactive)
npm run test:e2e:ui

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Mobile devices
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### All Tests
```bash
# Run everything
npm run test:all

# CI mode (for GitHub Actions)
npm run test:ci
```

## Test Coverage

### Coverage Thresholds
All projects maintain minimum coverage of:
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Coverage Reports
Reports are generated in `/coverage` directory:
- `coverage/index.html` - HTML report (open in browser)
- `coverage/coverage-final.json` - JSON data
- `coverage/lcov.info` - LCOV format for CI integration

### Viewing Coverage
```bash
# Generate and open HTML report
npm run test:coverage
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

## Test Results Logging

### Automatic Logging
The test logger automatically creates:
- **JSON logs:** `test-results/logs/test-log-{timestamp}.json`
- **HTML reports:** `test-results/logs/test-report-{timestamp}.html`

### Log Structure
```json
{
  "summary": {
    "total": 150,
    "passed": 142,
    "failed": 5,
    "skipped": 3,
    "totalDuration": 45230,
    "successRate": 95,
    "timestamp": "2026-01-30T10:00:00.000Z"
  },
  "logs": [
    {
      "timestamp": "2026-01-30T10:00:01.234Z",
      "level": "SUCCESS",
      "testSuite": "DecisionTable.unit.test.tsx",
      "testName": "should render table with decisions",
      "message": "Test passed",
      "duration": 45,
      "metadata": {
        "file": "DecisionTable.unit.test.tsx"
      }
    }
  ]
}
```

### HTML Report Features
- Color-coded results (green=pass, red=fail, yellow=skip)
- Sortable columns
- Summary metrics dashboard
- Filterable by test suite
- Responsive design

## Test Types and Examples

### 1. Unit Tests
**Location:** `__tests__/components/*.unit.test.tsx`

**Example:** Testing individual components
```typescript
describe('MetricCard - Unit Tests', () => {
  it('should render with correct data', () => {
    render(<MetricCard title="Total Accounts" value="42" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
```

**Characteristics:**
- Fast execution (< 100ms per test)
- Isolated component testing
- Mock all external dependencies
- Focus on component logic

### 2. Integration Tests
**Location:** `__tests__/integration/*.integration.test.tsx`

**Example:** Testing component interactions with APIs
```typescript
describe('Dashboard - Integration Tests', () => {
  it('should fetch and display metrics', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });
});
```

**Characteristics:**
- Medium execution time (100-500ms per test)
- Test multiple components together
- Use MSW for API mocking
- Verify data flow

### 3. E2E Tests
**Location:** `e2e/*.spec.ts`

**Example:** Testing complete user workflows
```typescript
test('should complete decision approval workflow', async ({ page }) => {
  await page.goto('/decisions');
  await page.getByRole('button', { name: /approve/i }).click();
  await expect(page.getByText(/approved/i)).toBeVisible();
});
```

**Characteristics:**
- Slower execution (1-10s per test)
- Real browser automation
- Test entire user journeys
- Cross-browser compatibility

### 4. Performance Tests
**Location:** `e2e/performance-security.spec.ts`

**Example:** Testing load times and metrics
```typescript
test('should meet Core Web Vitals', async ({ page }) => {
  const metrics = await page.evaluate(() => /* ... */);
  expect(metrics.lcp).toBeLessThan(2500);
});
```

**Metrics Tested:**
- First Contentful Paint (FCP) < 2.5s
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### 5. Security Tests
**Location:** `e2e/performance-security.spec.ts`

**Example:** Testing XSS prevention
```typescript
test('should prevent XSS attacks', async ({ page }) => {
  await searchInput.fill('<script>alert("XSS")</script>');
  expect(pageContent).not.toContain('<script>');
});
```

**Security Checks:**
- XSS prevention
- Input sanitization
- CSP headers
- Token leakage prevention

### 6. Accessibility Tests
**Location:** `e2e/*.spec.ts` (embedded in E2E tests)

**Example:** Testing keyboard navigation
```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.keyboard.press('Tab');
  expect(focusedElement).toBeTruthy();
});
```

**Accessibility Features:**
- ARIA labels
- Keyboard navigation
- Screen reader announcements
- Focus management

## CI/CD Integration

### GitHub Actions Workflow
Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Changes in `frontend/**` directory

### Workflow Jobs
1. **Unit Tests** (Matrix: Node 18.x, 20.x)
   - Install dependencies
   - Run Jest with coverage
   - Upload coverage to Codecov
   - Generate coverage report artifact

2. **E2E Tests**
   - Install Playwright browsers
   - Run all E2E tests
   - Upload Playwright report
   - Upload test videos on failure

3. **Lint**
   - Run ESLint
   - TypeScript type checking

4. **Build**
   - Production build validation

### Artifacts
- **Coverage reports:** Retained 30 days
- **Playwright reports:** Retained 30 days
- **Test videos:** Retained 7 days (only on failure)

## Debugging Failed Tests

### Unit/Integration Tests
```bash
# Debug specific test
npm test -- --testNamePattern="should render table"

# Update snapshots
npm test -- -u

# Verbose output
npm test -- --verbose

# Run only failed tests
npm test -- --onlyFailures
```

### E2E Tests
```bash
# Debug mode (step through)
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed

# Specific test file
npx playwright test dashboard.spec.ts

# Show Playwright report
npm run playwright:report

# Trace viewer (after test with --trace on)
npx playwright show-trace trace.zip
```

### Common Issues

#### Issue: Tests timeout
**Solution:**
```typescript
// Increase timeout
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

#### Issue: Element not found
**Solution:**
```typescript
// Add explicit waits
await page.waitForSelector('[data-testid="element"]');
await page.waitForLoadState('networkidle');
```

#### Issue: Flaky tests
**Solution:**
```typescript
// Use waitFor with proper conditions
await waitFor(() => {
  expect(screen.getByText('Content')).toBeInTheDocument();
}, { timeout: 5000 });
```

## Best Practices

### Writing Tests
1. **Descriptive names:** Use clear, descriptive test names
2. **Arrange-Act-Assert:** Structure tests clearly
3. **One assertion per test:** Focus on single behavior
4. **Avoid test interdependence:** Each test should be independent
5. **Clean up:** Reset state between tests

### Test Data
1. **Use fixtures:** Centralize test data in `test-fixtures.ts`
2. **Generate data:** Use helper functions for large datasets
3. **Realistic data:** Use production-like data
4. **Avoid hardcoding:** Extract values to constants

### Performance
1. **Parallel execution:** Run tests in parallel when possible
2. **Selective testing:** Use `.only` during development
3. **Mock external services:** Don't make real API calls
4. **Optimize waits:** Use specific wait conditions

### Maintenance
1. **Update regularly:** Keep test dependencies current
2. **Review failures:** Investigate and fix flaky tests
3. **Coverage monitoring:** Track coverage trends
4. **Documentation:** Document complex test scenarios

## Metrics and Reporting

### Key Metrics
- **Test Count:** Total number of tests
- **Pass Rate:** Percentage of passing tests
- **Coverage:** Code coverage percentage
- **Execution Time:** Total test run duration
- **Flakiness:** Rate of intermittent failures

### Weekly Report Example
```
Week of Jan 23-30, 2026

Total Tests: 247
Passed: 242 (98%)
Failed: 3 (1.2%)
Skipped: 2 (0.8%)

Coverage:
- Branches: 82%
- Functions: 89%
- Lines: 85%
- Statements: 86%

Average Execution Time:
- Unit: 12s
- Integration: 28s
- E2E: 3m 45s
- Total: 4m 25s

Flaky Tests: 2
- "should handle concurrent requests" (2/5 runs failed)
- "should update metrics in real-time" (1/5 runs failed)
```

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

### Internal Docs
- [TESTING.md](../TESTING.md) - Organization-level guide
- [BROWSER_COMPATIBILITY.md](./BROWSER_COMPATIBILITY.md) - Browser support
- [README.md](../README.md) - Project overview

### Support
- GitHub Issues for bug reports
- Team Slack #testing channel
- Weekly testing office hours

## Changelog

### v1.0.0 (2026-01-30)
- Initial test environment setup
- Comprehensive test suite for both applications
- Automated logging and reporting
- CI/CD integration with GitHub Actions
- HTML and JSON test reports
- Performance and security testing
- Accessibility testing coverage
