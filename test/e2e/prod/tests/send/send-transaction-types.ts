/**
 * Type definitions for send transaction test reporting
 * Provides structured data collection for step-by-step test execution tracking
 */

/**
 * Represents a single step in a send transaction test
 * Captures expected vs actual outcomes and any errors encountered
 */
export type SendTransactionStep = {
  stepName: string;
  expectedOutcome: string;
  actualOutcome: string | null;
  status: 'pending' | 'success' | 'failure' | 'skipped';
  error: string | null;
  timestamp: Date;
  duration?: number; // milliseconds
};

export type ActivityCheckStatus = 'pass' | 'warning' | 'fail';

/**
 * Represents the result of sending a transaction on a specific network
 * Aggregates all steps and provides summary statistics
 */
export type SendTransactionResult = {
  networkName: string;
  chainId: number;
  nativeSymbol: string;
  blockExplorerUrl?: string;
  account1Address: string;
  account2Address: string;
  transactionHash?: string;
  sentAmount?: string;
  sentActivityStatus?: ActivityCheckStatus;
  receivedActivityStatusAccount1?: ActivityCheckStatus;
  receivedActivityStatusAccount2?: ActivityCheckStatus;
  initialBalance?: string;
  finalBalance?: string;
  account1InitialBalance?: string;
  account1UpdatedBalance?: string;
  account2InitialBalance?: string;
  account2UpdatedBalance?: string;
  steps: SendTransactionStep[];
  overallStatus: 'passed' | 'failed' | 'running';
  timestamp: Date;
  duration?: number; // milliseconds
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    skippedSteps: number;
  };
};

/**
 * Consolidated report for all send transactions in a test run
 * Generated after all tests complete for cross-network analysis
 */
export type SendTransactionReport = {
  testName: string;
  testFile: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  results: SendTransactionResult[];
  summary: {
    totalNetworks: number;
    passedNetworks: number;
    failedNetworks: number;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
  };
};

/**
 * Configuration for a send test on a specific network
 */
export type SendTestNetworkConfig = {
  name: string;
  chainId: number;
  nativeSymbol: string;
  blockExplorerUrl?: string;
  rpcUrl: string;
};
