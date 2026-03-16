/**
 * Reporter for tracking and logging send transaction test steps
 * Provides real-time console feedback and structured data collection for report generation
 */

import {
  SendTransactionResult,
  SendTransactionStep,
  SendTestNetworkConfig,
} from './send-transaction-types';

/**
 * Manages step-by-step reporting of send transaction tests
 * Logs to console in real-time and collects structured data for later report generation
 */
export class SendTransactionReporter {
  private currentResult: SendTransactionResult;
  private stepStartTime: Date | null = null;

  constructor(networkConfig: SendTestNetworkConfig, account1: string, account2: string) {
    this.currentResult = {
      networkName: networkConfig.name,
      chainId: networkConfig.chainId,
      nativeSymbol: networkConfig.nativeSymbol,
      blockExplorerUrl: networkConfig.blockExplorerUrl,
      account1Address: account1,
      account2Address: account2,
      steps: [],
      overallStatus: 'running',
      timestamp: new Date(),
      summary: {
        totalSteps: 0,
        successfulSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
      },
    };
  }

  /**
   * Start a new test step - logs expected outcome and records timestamp
   * @param stepName - Description of the step being executed
   * @param expectedOutcome - What is expected to happen in this step
   */
  startStep(stepName: string, expectedOutcome: string): void {
    this.stepStartTime = new Date();
    const indent = '   ';
    console.log(`[PROD TEST] ➡️  STEP: ${stepName}`);
    console.log(`[PROD TEST] ${indent}Expected: ${expectedOutcome}`);

    // Create and add step to array
    const newStep: SendTransactionStep = {
      stepName,
      expectedOutcome,
      actualOutcome: '',
      status: 'success', // Default, will be updated by captureStep
      error: null,
      timestamp: this.stepStartTime,
      duration: 0,
    };
    this.currentResult.steps.push(newStep);
    this.currentResult.summary.totalSteps = this.currentResult.steps.length;
  }

  /**
   * Capture the result of a test step
   * @param actualOutcome - What actually happened (string result, value, UI state, etc.)
   * @param error - Optional error message if step failed
   * @param status - Override status detection (useful for skipped steps)
   */
  captureStep(
    actualOutcome: string,
    error?: string,
    status?: 'success' | 'failure' | 'skipped',
  ): void {
    const stepCount = this.currentResult.steps.length;
    if (stepCount === 0) {
      console.warn('[PROD TEST] ⚠️  captureStep called without startStep');
      return;
    }

    const lastStep = this.currentResult.steps[stepCount - 1];
    const duration = this.stepStartTime ? Date.now() - this.stepStartTime.getTime() : 0;

    // Determine status
    let finalStatus: 'success' | 'failure' | 'skipped' = status || 'success';
    if (error) {
      finalStatus = 'failure';
    }

    // Update last step
    lastStep.actualOutcome = actualOutcome;
    lastStep.status = finalStatus;
    lastStep.error = error || null;
    lastStep.duration = duration;

    // Update summary
    if (finalStatus === 'success') {
      this.currentResult.summary.successfulSteps += 1;
    } else if (finalStatus === 'failure') {
      this.currentResult.summary.failedSteps += 1;
    } else {
      this.currentResult.summary.skippedSteps += 1;
    }

    // Log result
    const indent = '   ';
    const statusIcon =
      finalStatus === 'success' ? '✅' : finalStatus === 'failure' ? '❌' : '⏭️';
    console.log(`[PROD TEST] ${statusIcon} Actual: ${actualOutcome}`);

    if (error) {
      console.log(`[PROD TEST] ${indent}Error: ${error}`);
    }
    if (duration > 0) {
      console.log(`[PROD TEST] ${indent}Duration: ${duration}ms`);
    }

    this.stepStartTime = null;
  }

  /**
   * Add a step directly (useful for one-liner steps or manual control)
   * @param step - Complete step object
   */
  addStep(step: SendTransactionStep): void {
    this.currentResult.steps.push(step);
    this.currentResult.summary.totalSteps = this.currentResult.steps.length;

    if (step.status === 'success') {
      this.currentResult.summary.successfulSteps += 1;
    } else if (step.status === 'failure') {
      this.currentResult.summary.failedSteps += 1;
    } else if (step.status === 'skipped') {
      this.currentResult.summary.skippedSteps += 1;
    }
  }

  /**
   * Update the last step's timing only (without changing status)
   * Useful for async operations where captureStep is called after completion
   */
  updateStepTiming(): void {
    const lastStep = this.currentResult.steps[this.currentResult.steps.length - 1];
    if (lastStep && this.stepStartTime) {
      lastStep.duration = Date.now() - this.stepStartTime.getTime();
    }
  }

  /**
   * Set transaction-level metadata
   */
  setTransactionHash(hash: string): void {
    this.currentResult.transactionHash = hash;
  }

  /**
   * Set balance information
   */
  setBalanceInfo(initialBalance?: string, finalBalance?: string): void {
    if (initialBalance !== undefined) {
      this.currentResult.initialBalance = initialBalance;
    }
    if (finalBalance !== undefined) {
      this.currentResult.finalBalance = finalBalance;
    }
  }

  /**
   * Mark test as passed
   */
  markAsPassed(): void {
    this.currentResult.overallStatus = 'passed';
    const duration = Date.now() - this.currentResult.timestamp.getTime();
    this.currentResult.duration = duration;
    console.log(
      `[PROD TEST] ✅ PASSED: ${this.currentResult.networkName} (${duration}ms)`,
    );
  }

  /**
   * Mark test as failed
   */
  markAsFailed(reason?: string): void {
    this.currentResult.overallStatus = 'failed';
    const duration = Date.now() - this.currentResult.timestamp.getTime();
    this.currentResult.duration = duration;
    const msg = reason ? ` - ${reason}` : '';
    console.log(
      `[PROD TEST] ❌ FAILED: ${this.currentResult.networkName}${msg} (${duration}ms)`,
    );
  }

  /**
   * Get the current result object
   * Call this when ready to generate a report
   */
  getCurrentResult(): SendTransactionResult {
    // Calculate final summary
    this.currentResult.summary.totalSteps = this.currentResult.steps.length;
    return { ...this.currentResult };
  }

  /**
   * Reset reporter for next network (keep config, clear steps)
   */
  reset(newNetworkConfig?: SendTestNetworkConfig): void {
    if (newNetworkConfig) {
      this.currentResult.networkName = newNetworkConfig.name;
      this.currentResult.chainId = newNetworkConfig.chainId;
      this.currentResult.nativeSymbol = newNetworkConfig.nativeSymbol;
      this.currentResult.blockExplorerUrl = newNetworkConfig.blockExplorerUrl;
    }
    this.currentResult.steps = [];
    this.currentResult.transactionHash = undefined;
    this.currentResult.initialBalance = undefined;
    this.currentResult.finalBalance = undefined;
    this.currentResult.overallStatus = 'running';
    this.currentResult.timestamp = new Date();
    this.currentResult.summary = {
      totalSteps: 0,
      successfulSteps: 0,
      failedSteps: 0,
      skippedSteps: 0,
    };
  }
}
