import * as fs from 'fs';
import * as path from 'path';
import TimerHelper from './TimerHelper';
import Timers from './Timers';

const THRESHOLD_MARGIN_PERCENT = 10;

type StepMetric = {
  name: string;
  duration: number;
  baseThreshold: number | null;
  threshold: number | null;
  validation: {
    passed: boolean;
    exceeded: number | null;
    percentOver: string | null;
  } | null;
};

type PerformanceMetrics = {
  testName: string;
  testFile: string;
  timestamp: string;
  thresholdMarginPercent: number;
  steps: StepMetric[];
  total: number;
  totalThreshold: number | null;
  hasThresholds: boolean;
  totalValidation: {
    passed: boolean;
    exceeded: number | null;
    percentOver: string | null;
  } | null;
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
   * Add multiple timers at once
   *
   * @param timers
   */
  addTimers(...timers: TimerHelper[]): void {
    timers.forEach((timer) => {
      this.addTimer(timer);
    });
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
      thresholdMarginPercent: THRESHOLD_MARGIN_PERCENT,
      steps: [],
      total: 0,
      totalThreshold: null,
      hasThresholds: false,
      totalValidation: null,
    };

    let totalSeconds = 0;
    let totalThresholdMs = 0;
    let allHaveThresholds = true;

    for (const timer of this.timers) {
      const duration = timer.getDuration();
      const durationInSeconds = timer.getDurationInSeconds();

      if (duration !== null && !isNaN(duration) && duration > 0) {
        const { threshold } = timer;
        const hasThreshold = threshold !== null;

        let passed = true;
        let exceeded: number | null = null;
        let percentOver: string | null = null;

        if (hasThreshold) {
          passed = duration <= threshold;
          if (!passed) {
            exceeded = duration - threshold;
            percentOver = `${((exceeded / threshold) * 100).toFixed(1)}%`;
          }
        }

        const stepObject: StepMetric = {
          name: timer.id,
          duration,
          baseThreshold: timer.baseThreshold,
          threshold: timer.threshold,
          validation: hasThreshold
            ? {
                passed,
                exceeded,
                percentOver,
              }
            : null,
        };
        metrics.steps.push(stepObject);

        totalSeconds += durationInSeconds;

        if (threshold === null) {
          allHaveThresholds = false;
        } else {
          totalThresholdMs += threshold;
        }
      }
    }

    metrics.total = totalSeconds;
    metrics.totalThreshold = allHaveThresholds ? totalThresholdMs : null;
    metrics.hasThresholds = this.timers.some((t) => t.hasThreshold());

    // Add total validation if all steps have thresholds
    if (allHaveThresholds && totalThresholdMs > 0) {
      const totalDurationMs = totalSeconds * 1000;
      const totalPassed = totalDurationMs <= totalThresholdMs;

      let totalExceeded: number | null = null;
      let totalPercentOver: string | null = null;

      if (!totalPassed) {
        totalExceeded = totalDurationMs - totalThresholdMs;
        totalPercentOver = `${((totalExceeded / totalThresholdMs) * 100).toFixed(1)}%`;
      }

      metrics.totalValidation = {
        passed: totalPassed,
        exceeded: totalExceeded,
        percentOver: totalPercentOver,
      };
    }

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
        '../../test-results/power-user-scenarios',
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
      let status = '⏱️';
      if (step.validation) {
        status = step.validation.passed ? '✅' : '❌';
      }
      const thresholdInfo = step.threshold
        ? ` (threshold: ${step.threshold}ms)`
        : '';
      console.log(
        `  ${status} ${step.name}: ${durationSeconds.toFixed(2)}s${thresholdInfo}`,
      );
    });
    console.log(`  📈 Total: ${metrics.total.toFixed(2)}s`);

    if (metrics.totalValidation) {
      const totalStatus = metrics.totalValidation.passed ? '✅' : '❌';
      console.log(
        `  ${totalStatus} Total validation: ${metrics.totalValidation.passed ? 'PASSED' : 'FAILED'}`,
      );
    }
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
