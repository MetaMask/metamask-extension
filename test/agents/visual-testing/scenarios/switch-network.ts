import type { Scenario, ScenarioFactory } from './types';

const TARGET_NETWORK = 'Ethereum';

export const createSwitchNetwork: ScenarioFactory = (): Scenario => {
  return {
    name: 'switch_network',
    description: `Switch the active network to ${TARGET_NETWORK} via the network picker.`,
    difficulty: 'easy',
    stateMode: 'default',
    taskPrompt: [
      `Verify visually test MetaMask Extension. Switch the active network to "${TARGET_NETWORK}".`,
      '',
      'Steps you will likely need:',
      '1. Use mm describe-screen to see the current network',
      '2. Click the network picker/selector',
      `3. Find and select "${TARGET_NETWORK}" from the network list`,
      '4. Verify the network switched by using mm describe-screen',
      '',
      `The task is complete when describe-screen shows "${TARGET_NETWORK}" as the active network.`,
    ].join('\n'),
    assertion: {
      type: 'network-switched',
      expectedNetwork: TARGET_NETWORK,
    },
    disallowedBashPatterns: [],
  };
};
