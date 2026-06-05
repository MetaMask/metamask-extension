import type { Scenario, ScenarioFactory } from './types';

const TEST_DAPP_URL = 'https://metamask.github.io/test-dapp/';

export const createConnectDappSubmitTransaction: ScenarioFactory =
  (): Scenario => {
    return {
      name: 'connect_dapp_submit_transaction',
      description:
        'Connect MetaMask to the test dapp, submit a transaction, and confirm it.',
      difficulty: 'hard',
      stateMode: 'default',
      taskPrompt: [
        'Verify visually test MetaMask Extension. Connect to the test dapp and submit a transaction.',
        '',
        'Steps you will likely need:',
        `1. Use mm navigate to open ${TEST_DAPP_URL}`,
        '2. Use mm describe-screen to understand the dapp state',
        '3. Click the "Connect" button on the dapp page',
        '4. Handle the MetaMask connection approval when it appears in the sidepanel',
        '5. Once connected, click a transaction button on the dapp (e.g., "Send EIP 1559" or similar send button)',
        '6. Wait for the confirmation to appear in the MetaMask sidepanel',
        '7. Review and confirm the transaction',
        '8. Verify the transaction was submitted successfully',
        '',
        'The task is complete when the transaction has been confirmed in MetaMask.',
      ].join('\n'),
      assertion: {
        type: 'screen-contains',
        text: 'confirmed',
      },
      disallowedBashPatterns: [],
    };
  };
