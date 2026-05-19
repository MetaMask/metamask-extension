import type { Scenario, ScenarioFactory } from './types';

const SEND_AMOUNT = '0.001';

export const createSendEthHappyPath: ScenarioFactory = (): Scenario => {
  return {
    name: 'send_eth_happy_path',
    description:
      'Send a small amount of ETH to yourself (self-send) and verify the transaction.',
    difficulty: 'medium',
    stateMode: 'default',
    taskPrompt: [
      `Verify visually test MetaMask Extension. Send ${SEND_AMOUNT} ETH to yourself (self-send).`,
      '',
      'Steps you will likely need:',
      '1. Use mm describe-screen to identify your account address',
      '2. Click the Send button on the home screen',
      '3. Paste your own address as the recipient',
      `4. Enter ${SEND_AMOUNT} as the amount`,
      '5. Click Next/Continue to reach the confirmation screen',
      '6. Review and confirm the transaction',
      '7. Verify the transaction appears in your activity',
      '',
      'The task is complete when the transaction has been confirmed',
      'and the activity tab shows the sent transaction.',
    ].join('\n'),
    assertion: {
      type: 'screen-contains',
      text: 'sent',
    },
    disallowedBashPatterns: [],
  };
};
