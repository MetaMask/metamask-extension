import type { ScenarioFactory } from './types';
import { createRenameHappyPath } from './rename-happy-path';
import { createSwitchNetwork } from './switch-network';
import { createSendEthHappyPath } from './send-eth-happy-path';
import { createAddCustomToken } from './add-custom-token';
import { createErrorRecoveryInsufficientFunds } from './error-recovery-insufficient-funds';
import { createConnectDappSubmitTransaction } from './connect-dapp-submit-transaction';

export const SCENARIOS: Record<string, ScenarioFactory> = {
  'rename-happy-path': createRenameHappyPath,
  'switch-network': createSwitchNetwork,
  'send-eth-happy-path': createSendEthHappyPath,
  'add-custom-token': createAddCustomToken,
  'error-recovery-insufficient-funds': createErrorRecoveryInsufficientFunds,
  'connect-dapp-submit-transaction': createConnectDappSubmitTransaction,
};

export {
  createRenameHappyPath,
  createSwitchNetwork,
  createSendEthHappyPath,
  createAddCustomToken,
  createErrorRecoveryInsufficientFunds,
  createConnectDappSubmitTransaction,
};
