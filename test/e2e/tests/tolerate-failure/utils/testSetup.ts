import * as fs from 'fs';
import * as path from 'path';
import Timers, { TimerWithId } from './Timers';
import TimerHelper from './TimersHelper';

export type TimerTestResult = {
  testName: string;
  testFile: string;
  timestamp: string;
  timers: TimerWithId[];
};

/**
 * Performance tracker that collects TimerHelper instances and generates reports
 */
class TestPerformanceTracker {
  private timers: TimerHelper[] = [];

  addTimer(timer: TimerHelper): void {
    this.timers.push(timer);
  }

  getAllTimers(): TimerHelper[] {
    return [...this.timers];
  }

  clear(): void {
    this.timers = [];
  }

  generateReport(testName: string, testFilePath: string): void {
    try {
      // Get all timer data from the global Timers singleton
      const allTimers = Timers.getAllTimers();

      // Only generate report if there are timers
      if (allTimers.length === 0) {
        console.log('No timers found for this test, skipping JSON generation');
        return;
      }

      // Create test result object using existing TimerWithId type
      const timerResults: TimerTestResult = {
        testName,
        testFile: path.basename(testFilePath),
        timestamp: new Date().toISOString(),
        timers: allTimers, // Use the existing TimerWithId[] directly
      };

      // Create results directory if it doesn't exist
      const resultsDir = path.join(__dirname, '..', 'results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      // Generate filename with test name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/gu, '-');
      const testNameSlug = testName.toLowerCase().replace(/[^a-z0-9]+/gu, '-');
      const filename = `${testNameSlug}-${timestamp}.json`;
      const filePath = path.join(resultsDir, filename);

      // Write timer data to JSON file
      fs.writeFileSync(filePath, JSON.stringify(timerResults, null, 2));
      console.log(`✅ Timer results saved to: ${filePath}`);

      // Also log a summary to console
      console.log('📊 Timer Summary:');
      timerResults.timers.forEach((timer) => {
        const durationSeconds = timer.duration ? timer.duration / 1000 : 0;
        console.log(`  ⏱️  ${timer.id}: ${durationSeconds}s`);
      });
    } catch (error) {
      console.error('❌ Error generating timer report:', error);
    }
  }
}

// Global performance tracker instance for the test suite
const performanceTracker = new TestPerformanceTracker();

/**
 * Export the performance tracker for direct use in tests
 */
export { performanceTracker };

/**
 * Setup function that configures automatic timer reporting for test suites
 */
export function setupTimerReporting(): void {
  // Clear any previous timers at the start of each test
  beforeEach(function () {
    Timers.resetTimers();
    performanceTracker.clear();
  });

  // Generate timer report after each test
  afterEach(function () {
    if (this.currentTest) {
      performanceTracker.generateReport(
        this.currentTest.title,
        this.currentTest.file || 'unknown',
      );
    }
  });
}
