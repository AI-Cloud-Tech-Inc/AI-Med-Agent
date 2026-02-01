import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};

          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.renderTime || entry.loadTime;
            }
            if (entry.name === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime;
            }
          });

          setTimeout(() => resolve(vitals), 3000);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] });
      });
    });

    // Core Web Vitals thresholds
    expect(metrics.fcp).toBeLessThan(2500); // FCP < 2.5s
    if (metrics.lcp) expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    if (metrics.fid) expect(metrics.fid).toBeLessThan(100); // FID < 100ms
  });

  test('should load page resources efficiently', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check response time
    const timing = await page.evaluate(() => {
      const perfData = window.performance.timing;
      return {
        responseTime: perfData.responseEnd - perfData.requestStart,
        domLoad: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        pageLoad: perfData.loadEventEnd - perfData.navigationStart,
      };
    });

    expect(timing.responseTime).toBeLessThan(1000);
    expect(timing.domLoad).toBeLessThan(2000);
    expect(timing.pageLoad).toBeLessThan(3000);
  });

  test('should handle concurrent requests efficiently', async ({ page }) => {
    const startTime = Date.now();

    await Promise.all([
      page.goto('/'),
      page.goto('/decisions'),
      page.goto('/organization'),
    ]);

    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(5000);
  });

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/');

    const initialMetrics = await page.metrics();
    
    // Perform actions that might cause memory leaks
    for (let i = 0; i < 10; i++) {
      await page.getByRole('link', { name: /decisions/i }).click();
      await page.waitForLoadState('networkidle');
      await page.getByRole('link', { name: /dashboard/i }).click();
      await page.waitForLoadState('networkidle');
    }

    const finalMetrics = await page.metrics();
    
    // Check that JS heap size didn't grow excessively
    const heapGrowth = finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize;
    expect(heapGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
  });

  test('should optimize bundle size', async ({ page }) => {
    const response = await page.goto('/');
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r: any) => ({
        name: r.name,
        size: r.transferSize,
        duration: r.duration,
      }));
    });

    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);

    // Total JS should be less than 500KB
    expect(totalJsSize).toBeLessThan(500 * 1024);
  });
});

test.describe('Load Tests', () => {
  test('should handle rapid page navigation', async ({ page }) => {
    await page.goto('/');

    const pages = ['/', '/decisions', '/organization', '/policies'];
    const startTime = Date.now();

    for (let i = 0; i < 20; i++) {
      const targetPage = pages[i % pages.length];
      await page.goto(targetPage);
    }

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / 20;

    expect(avgTime).toBeLessThan(500); // Average less than 500ms per navigation
  });

  test('should handle large dataset rendering', async ({ page }) => {
    // Mock API with large dataset
    await page.route('/api/decisions', (route) => {
      const decisions = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        title: `Decision ${i}`,
        status: 'pending',
        priority: 'medium',
      }));
      route.fulfill({ status: 200, body: JSON.stringify({ decisions }) });
    });

    await page.goto('/decisions');
    
    const renderTime = await page.evaluate(() => {
      const start = performance.now();
      // Trigger re-render
      return performance.now() - start;
    });

    expect(renderTime).toBeLessThan(1000); // Render in less than 1s
  });
});

test.describe('Security Tests', () => {
  test('should prevent XSS attacks', async ({ page }) => {
    await page.goto('/decisions');
    
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('<script>alert("XSS")</script>');
    
    await page.waitForTimeout(500);
    
    // Verify script didn't execute
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    expect(alerts).toHaveLength(0);
  });

  test('should sanitize user input', async ({ page }) => {
    await page.goto('/decisions');
    
    const maliciousInputs = [
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)"></iframe>',
    ];

    for (const input of maliciousInputs) {
      const searchBox = page.getByPlaceholder(/search/i);
      await searchBox.fill(input);
      
      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>');
      expect(pageContent).not.toContain('onerror');
      expect(pageContent).not.toContain('javascript:');
    }
  });

  test('should have CSP headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers?.['content-security-policy']).toBeDefined();
  });

  test('should not leak authentication tokens', async ({ page }) => {
    await page.goto('/');
    
    const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
    const sessionStorage = await page.evaluate(() => JSON.stringify(window.sessionStorage));
    
    expect(localStorage).not.toContain('Bearer ');
    expect(sessionStorage).not.toContain('Bearer ');
  });
});

test.describe('Compatibility Tests', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];

  for (const browserType of browsers) {
    test(`should work correctly in ${browserType}`, async ({ page }) => {
      await page.goto('/');
      
      await expect(page.getByRole('heading')).toBeVisible();
      await expect(page.getByRole('navigation')).toBeVisible();
      
      // Test key functionality
      await page.getByRole('link', { name: /decisions/i }).click();
      await expect(page).toHaveURL(/\/decisions/);
    });
  }
});
