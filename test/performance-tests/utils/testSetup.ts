import { performanceTracker } from './PerformanceTracker';

/**
 * Setup function that configures automatic performance tracking for test suites.
 * Call this at the beginning of your describe block.
 *
 * Usage:
 * ```typescript
 * describe('My Performance Test', function () {
 *   setupPerformanceReporting();
 *
 *   it('measures something', async function () {
 *     const timer = new TimerHelper('My timer', { chrome: 1000, firefox: 1200 });
 *     await timer.measure(async () => {
 *       // actions to measure
 *     });
 *     performanceTracker.addTimer(timer);
 *   });
 * });
 * ```
 */
export function setupPerformanceReporting(): void {
  // Reset the tracker before each test
  beforeEach(function () {
    performanceTracker.reset();
  });

  // Generate performance report after each test
  afterEach(function () {
    if (this.currentTest) {
      const timerCount = performanceTracker.getTimerCount();
      if (timerCount === 0) {
        console.log(
          '⚠️ No timers found in performance tracker, skipping report generation',
        );
        return;
      }

      console.log(`📊 Found ${timerCount} timers in performance tracker`);
      performanceTracker.generateReport(
        this.currentTest.title,
        this.currentTest.file || 'unknown',
      );
    }
  });
}

// Re-export for convenience
export { performanceTracker } from './PerformanceTracker';
export { default as TimerHelper } from './TimerHelper';
export type { BrowserThreshold } from './TimerHelper';
