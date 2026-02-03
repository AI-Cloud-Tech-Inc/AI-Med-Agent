/**
 * Custom Jest Reporter for Enhanced Test Logging
 */

const { TestLogger, LogLevel } = require('../lib/test-logger');

class CustomJestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.logger = new TestLogger('./test-results/logs');
  }

  onRunStart(results, options) {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Starting Test Execution');
    console.log('='.repeat(60) + '\n');
    
    this.logger.log(
      LogLevel.INFO,
      'Test Runner',
      'Initialization',
      `Starting test run with ${results.numTotalTestSuites} test suites`
    );
  }

  onTestStart(test) {
    const suiteName = this.getTestSuiteName(test);
    this.logger.startSuite(suiteName);
  }

  onTestResult(test, testResult, aggregatedResult) {
    const suiteName = this.getTestSuiteName(test);
    
    testResult.testResults.forEach(result => {
      if (result.status === 'passed') {
        this.logger.passTest(result.title, {
          file: suiteName,
          duration: result.duration,
        });
      } else if (result.status === 'failed') {
        this.logger.failTest(
          result.title,
          result.failureMessages[0],
          {
            file: suiteName,
            duration: result.duration,
          }
        );
      } else if (result.status === 'skipped') {
        this.logger.skipTest(result.title, 'Test skipped');
      }
    });

    this.logger.endSuite();
  }

  onRunComplete(contexts, results) {
    const summary = {
      total: results.numTotalTests,
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      skipped: results.numPendingTests,
      duration: results.testResults.reduce(
        (sum, result) => sum + (result.perfStats?.end - result.perfStats?.start || 0),
        0
      ),
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Execution Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests:    ${summary.total}`);
    console.log(`✅ Passed:      ${summary.passed}`);
    console.log(`❌ Failed:      ${summary.failed}`);
    console.log(`⏭️  Skipped:     ${summary.skipped}`);
    console.log(`⏱️  Duration:    ${summary.duration}ms`);
    console.log('='.repeat(60) + '\n');

    // Save logs to file
    this.logger.saveToFile();
    this.logger.saveHTMLReport();

    // Log file locations
    console.log('\n📁 Test artifacts saved:');
    console.log(`   - JSON Log: test-results/logs/test-log-*.json`);
    console.log(`   - HTML Report: test-results/logs/test-report-*.html`);
    console.log(`   - Coverage: coverage/index.html\n`);

    // Exit with proper code
    if (results.numFailedTests > 0) {
      process.exitCode = 1;
    }
  }

  getTestSuiteName(test) {
    return test.path.split('/').pop() || test.path;
  }
}

module.exports = CustomJestReporter;
