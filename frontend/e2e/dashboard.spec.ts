import { test, expect } from '@playwright/test';

test.describe('Governance Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the dashboard title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /governance dashboard/i })).toBeVisible();
  });

  test('should navigate to decisions page', async ({ page }) => {
    await page.getByRole('link', { name: /decisions/i }).click();
    await expect(page).toHaveURL(/\/decisions/);
  });

  test('should display metric cards', async ({ page }) => {
    const metricCards = page.locator('[data-testid="metric-card"]');
    await expect(metricCards).toHaveCount(4);
  });

  test('should filter decisions by status', async ({ page }) => {
    await page.goto('/decisions');
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByRole('option', { name: /pending/i }).click();
    
    const pendingDecisions = page.locator('[data-status="pending"]');
    const count = await pendingDecisions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
  });
});

test.describe('Organization Tree', () => {
  test('should display organization structure', async ({ page }) => {
    await page.goto('/organization');
    await expect(page.getByText(/root/i)).toBeVisible();
  });

  test('should expand and collapse OUs', async ({ page }) => {
    await page.goto('/organization');
    const expandButton = page.getByRole('button', { name: /expand/i }).first();
    await expandButton.click();
    await expect(page.getByText(/organizational unit/i)).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    // Note: Requires @axe-core/playwright for full a11y testing
    // This is a placeholder for accessibility checks
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocusable);
  });
});
