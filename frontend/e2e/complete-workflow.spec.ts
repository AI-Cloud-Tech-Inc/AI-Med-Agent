import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load and Navigation', () => {
    test('should load dashboard successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/AI-Med-Agent/);
      await expect(page.getByRole('heading', { name: /governance dashboard/i })).toBeVisible();
    });

    test('should display all metric cards', async ({ page }) => {
      const metricCards = page.locator('[data-testid="metric-card"]');
      await expect(metricCards).toHaveCount(4);
    });

    test('should navigate between pages', async ({ page }) => {
      await page.getByRole('link', { name: /decisions/i }).click();
      await expect(page).toHaveURL(/\/decisions/);
      
      await page.getByRole('link', { name: /organization/i }).click();
      await expect(page).toHaveURL(/\/organization/);
      
      await page.getByRole('link', { name: /dashboard/i }).click();
      await expect(page).toHaveURL(/\//);
    });
  });

  test.describe('Decision Management Workflow', () => {
    test('should complete full decision approval workflow', async ({ page }) => {
      // Navigate to decisions page
      await page.getByRole('link', { name: /decisions/i }).click();
      
      // Filter for pending decisions
      await page.getByRole('button', { name: /filter/i }).click();
      await page.getByRole('option', { name: /pending/i }).click();
      
      // Select first decision
      const firstDecision = page.locator('[data-testid="decision-row"]').first();
      await firstDecision.click();
      
      // View details
      await expect(page.getByText(/decision details/i)).toBeVisible();
      
      // Approve decision
      await page.getByRole('button', { name: /approve/i }).click();
      
      // Confirm approval
      await page.getByRole('button', { name: /confirm/i }).click();
      
      // Verify success message
      await expect(page.getByText(/decision approved successfully/i)).toBeVisible();
    });

    test('should reject decision with reason', async ({ page }) => {
      await page.getByRole('link', { name: /decisions/i }).click();
      
      const firstDecision = page.locator('[data-testid="decision-row"]').first();
      await firstDecision.click();
      
      await page.getByRole('button', { name: /reject/i }).click();
      
      // Provide rejection reason
      await page.getByLabel(/reason/i).fill('Does not meet security requirements');
      await page.getByRole('button', { name: /confirm reject/i }).click();
      
      await expect(page.getByText(/decision rejected/i)).toBeVisible();
    });
  });

  test.describe('Search and Filtering', () => {
    test('should search decisions by keyword', async ({ page }) => {
      await page.getByRole('link', { name: /decisions/i }).click();
      
      const searchBox = page.getByPlaceholder(/search decisions/i);
      await searchBox.fill('account creation');
      
      await page.waitForTimeout(500); // Debounce
      
      const results = page.locator('[data-testid="decision-row"]');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
      
      await expect(results.first()).toContainText(/account/i);
    });

    test('should filter by multiple criteria', async ({ page }) => {
      await page.getByRole('link', { name: /decisions/i }).click();
      
      // Filter by status
      await page.getByLabel(/status/i).selectOption('pending');
      
      // Filter by priority
      await page.getByLabel(/priority/i).selectOption('high');
      
      // Verify filtered results
      const results = page.locator('[data-testid="decision-row"]');
      const firstResult = results.first();
      
      await expect(firstResult.locator('[data-status="pending"]')).toBeVisible();
      await expect(firstResult.locator('[data-priority="high"]')).toBeVisible();
    });
  });

  test.describe('Organization Tree', () => {
    test('should display and interact with organization tree', async ({ page }) => {
      await page.getByRole('link', { name: /organization/i }).click();
      
      // Verify root node is visible
      await expect(page.getByText(/root/i)).toBeVisible();
      
      // Expand organizational unit
      const expandButton = page.getByRole('button', { name: /expand/i }).first();
      await expandButton.click();
      
      // Verify child nodes appear
      await expect(page.getByText(/production/i)).toBeVisible();
      await expect(page.getByText(/development/i)).toBeVisible();
    });

    test('should show account details on click', async ({ page }) => {
      await page.getByRole('link', { name: /organization/i }).click();
      
      // Click on an account
      const accountNode = page.getByText(/account-/i).first();
      await accountNode.click();
      
      // Verify details panel appears
      await expect(page.getByText(/account details/i)).toBeVisible();
      await expect(page.getByText(/account id/i)).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show mobile navigation menu', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu/i });
      await expect(menuButton).toBeVisible();
      
      await menuButton.click();
      
      await expect(page.getByRole('navigation')).toBeVisible();
    });

    test('should scroll metric cards horizontally', async ({ page }) => {
      const container = page.locator('[data-testid="metrics-container"]');
      const scrollWidth = await container.evaluate(el => el.scrollWidth);
      const clientWidth = await container.evaluate(el => el.clientWidth);
      
      expect(scrollWidth).toBeGreaterThan(clientWidth);
    });
  });

  test.describe('Performance', () => {
    test('should load page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // 3 seconds
    });

    test('should lazy load images', async ({ page }) => {
      const images = page.locator('img[loading="lazy"]');
      const count = await images.count();
      
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error state when API fails', async ({ page }) => {
      await page.route('/api/metrics', route => {
        route.fulfill({ status: 500, body: 'Server error' });
      });
      
      await page.goto('/');
      
      await expect(page.getByText(/error loading data/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    });

    test('should retry failed requests', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('/api/metrics', route => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({ status: 500, body: 'Server error' });
        } else {
          route.fulfill({ 
            status: 200, 
            body: JSON.stringify({ totalAccounts: 42 }) 
          });
        }
      });
      
      await page.goto('/');
      
      const retryButton = page.getByRole('button', { name: /retry/i });
      await retryButton.click();
      
      await expect(page.getByText('42')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
      
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.getByRole('link', { name: /decisions/i }).click();
      
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeVisible();
    });
  });

  test.describe('Security', () => {
    test('should not expose sensitive data in DOM', async ({ page }) => {
      const pageContent = await page.content();
      
      expect(pageContent).not.toContain('aws_secret_key');
      expect(pageContent).not.toContain('password');
      expect(pageContent).not.toContain('api_token');
    });

    test('should have secure headers', async ({ page }) => {
      const response = await page.goto('/');
      const headers = response?.headers();
      
      expect(headers?.['x-frame-options']).toBe('DENY');
      expect(headers?.['x-content-type-options']).toBe('nosniff');
    });
  });
});
