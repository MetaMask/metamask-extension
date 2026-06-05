import type { Scenario, ScenarioFactory } from './types';

const EXCESSIVE_AMOUNT = '100';

export const createErrorRecoveryInsufficientFunds: ScenarioFactory =
  (): Scenario => {
    return {
      name: 'error_recovery_insufficient_funds',
      description:
        'Attempt to send more ETH than available, recognize the error, and return to a clean state.',
      difficulty: 'hard',
      stateMode: 'default',
      taskPrompt: [
        `Verify visually test MetaMask Extension. Send ${EXCESSIVE_AMOUNT} ETH to yourself.`,
        '',
        'Steps you will likely need:',
        '1. Use mm describe-screen to identify your account address and balance',
        '2. Click the Send button on the home screen',
        '3. Enter your own address as the recipient',
        `4. Enter ${EXCESSIVE_AMOUNT} as the amount`,
        '5. Observe any errors or issues that prevent the transaction',
        '6. If the transaction cannot be completed, navigate back to the home screen',
        '',
        'The task is complete when either the transaction is confirmed,',
        'or you have returned to the home screen after determining',
        'the transaction is not possible due to insufficient funds.',
      ].join('\n'),
      assertion: {
        type: 'screen-contains',
        text: 'account',
      },
      disallowedBashPatterns: [],
    };
  };
