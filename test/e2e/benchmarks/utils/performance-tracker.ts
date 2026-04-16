import * as fs from 'fs';
import * as path from 'path';
import TimerHelper from './timer-helper';
import Timers from './timers';

type StepMetric = {
  name: string;
  duration: number;
};

type PerformanceMetrics = {
  testName: string;
  testFile: string;
  timestamp: string;
  steps: StepMetric[];
  total: number;
};

/**
 * PerformanceTracker - Collects TimerHelper instances and generates performance reports
 */
export class PerformanceTracker {
  private timers: TimerHelper[];

  constructor() {
    this.timers = [];
  }

  /**
   * Add a single timer to the tracker
   *
   * @param timer
   */
  addTimer(timer: TimerHelper): void {
    if (this.timers.find((existingTimer) => existingTimer.id === timer.id)) {
      return;
    }
    this.timers.push(timer);
  }

  /**
   * Get the count of registered timers
   */
  getTimerCount(): number {
    return this.timers.length;
  }

  /**
   * Generate and save the performance report
   *
   * @param testName
   * @param testFilePath
   */
  generateReport(testName: string, testFilePath: string): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      testName,
      testFile: path.basename(testFilePath),
      timestamp: new Date().toISOString(),
      steps: [],
      total: 0,
    };

    let totalSeconds = 0;

    for (const timer of this.timers) {
      const duration = timer.getDuration();
      const durationInSeconds = timer.getDurationInSeconds();

      if (duration !== null && !isNaN(duration) && duration > 0) {
        const stepObject: StepMetric = {
          name: timer.id,
          duration,
        };
        metrics.steps.push(stepObject);

        totalSeconds += durationInSeconds;
      }
    }

    metrics.total = totalSeconds;

    // Save the report to file
    this._saveReport(metrics);

    // Log summary to console
    this._logSummary(metrics);

    return metrics;
  }

  private _saveReport(metrics: PerformanceMetrics): void {
    try {
      const resultsDir = path.join(
        __dirname,
        '../../../../test-artifacts/benchmarks/performance-tracker',
      );
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/gu, '-');
      const testNameSlug = metrics.testName
        .toLowerCase()
        .replace(/[^a-z0-9]+/gu, '-');
      const filename = `${testNameSlug}-${timestamp}.json`;
      const filePath = path.join(resultsDir, filename);

      fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2));
      console.log(`✅ Performance report saved to: ${filePath}`);
    } catch (error) {
      console.error('❌ Error saving performance report:', error);
    }
  }

  private _logSummary(metrics: PerformanceMetrics): void {
    console.log('📊 Performance Summary:');
    metrics.steps.forEach((step) => {
      const durationSeconds = step.duration / 1000;
      console.log(`  ⏱️  ${step.name}: ${durationSeconds.toFixed(2)}s`);
    });
    console.log(`  📈 Total: ${metrics.total.toFixed(2)}s`);
  }

  /**
   * Reset the tracker for the next test
   */
  reset(): void {
    this.timers = [];
    Timers.resetTimers();
  }
}

// Export singleton instance for use in tests
export const performanceTracker = new PerformanceTracker();
