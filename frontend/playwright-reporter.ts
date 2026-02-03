import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

class CustomPlaywrightReporter implements Reporter {
  private startTime: number = 0;
  private results: any[] = [];
  private suite: string = '';

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    console.log('\n' + '='.repeat(60));
    console.log('🎭 Starting Playwright Test Execution');
    console.log('='.repeat(60));
    console.log(`Running ${suite.allTests().length} tests across ${config.projects.length} projects\n`);
  }

  onTestBegin(test: TestCase, result: TestResult) {
    this.suite = test.parent.title;
    console.log(`▶️  Running: ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const status = result.status;
    const duration = result.duration;
    
    const statusEmoji = {
      'passed': '✅',
      'failed': '❌',
      'timedOut': '⏱️',
      'skipped': '⏭️',
    }[status] || '❓';

    console.log(`${statusEmoji} ${status.toUpperCase()} (${duration}ms): ${test.title}`);

    this.results.push({
      suite: test.parent.title,
      title: test.title,
      status,
      duration,
      error: result.error?.message,
      retry: result.retry,
      project: test.parent.project()?.name,
    });

    if (result.error) {
      console.log(`   Error: ${result.error.message}`);
    }
  }

  onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 Playwright Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests:    ${total}`);
    console.log(`✅ Passed:      ${passed}`);
    console.log(`❌ Failed:      ${failed}`);
    console.log(`⏭️  Skipped:     ${skipped}`);
    console.log(`⏱️  Duration:    ${duration}ms`);
    console.log(`🎯 Success Rate: ${Math.round((passed / total) * 100)}%`);
    console.log('='.repeat(60) + '\n');

    // Generate detailed JSON report
    this.generateJSONReport({
      summary: {
        total,
        passed,
        failed,
        skipped,
        duration,
        successRate: Math.round((passed / total) * 100),
        timestamp: new Date().toISOString(),
      },
      results: this.results,
    });

    // Generate HTML report
    this.generateHTMLReport({
      total,
      passed,
      failed,
      skipped,
      duration,
      successRate: Math.round((passed / total) * 100),
    });

    console.log('📁 Test artifacts:');
    console.log('   - HTML Report: test-results/playwright-report/index.html');
    console.log('   - JSON Report: test-results/playwright-detailed-results.json');
    console.log('   - Videos: test-results/videos/ (on failure)\n');
  }

  private generateJSONReport(data: any) {
    const reportDir = 'test-results';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'playwright-detailed-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(data, null, 2));
  }

  private generateHTMLReport(summary: any) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Playwright Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      margin: 0;
      padding: 20px;
      background: #0f172a;
      color: #e2e8f0;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      color: #60a5fa;
      margin-bottom: 30px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .summary-card {
      background: #1e293b;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #60a5fa;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #94a3b8;
      font-size: 14px;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #1e293b;
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: #334155;
      padding: 12px;
      text-align: left;
      color: #e2e8f0;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #334155;
    }
    .passed { color: #22c55e; }
    .failed { color: #ef4444; }
    .skipped { color: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎭 Playwright Test Report</h1>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Total Tests</h3>
        <div class="value">${summary.total}</div>
      </div>
      <div class="summary-card" style="border-left-color: #22c55e;">
        <h3>Passed</h3>
        <div class="value" style="color: #22c55e;">${summary.passed}</div>
      </div>
      <div class="summary-card" style="border-left-color: #ef4444;">
        <h3>Failed</h3>
        <div class="value" style="color: #ef4444;">${summary.failed}</div>
      </div>
      <div class="summary-card">
        <h3>Duration</h3>
        <div class="value">${Math.round(summary.duration / 1000)}s</div>
      </div>
      <div class="summary-card" style="border-left-color: #8b5cf6;">
        <h3>Success Rate</h3>
        <div class="value" style="color: #8b5cf6;">${summary.successRate}%</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Suite</th>
          <th>Test</th>
          <th>Project</th>
          <th>Status</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${this.results.map(r => `
          <tr>
            <td>${r.suite}</td>
            <td>${r.title}</td>
            <td>${r.project || 'N/A'}</td>
            <td class="${r.status}">${r.status}</td>
            <td>${r.duration}ms</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;

    const reportPath = path.join('test-results', 'playwright-custom-report.html');
    fs.writeFileSync(reportPath, html);
  }
}

export default CustomPlaywrightReporter;
