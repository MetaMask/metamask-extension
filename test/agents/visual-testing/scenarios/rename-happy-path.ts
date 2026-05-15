import type { Scenario, ScenarioFactory } from './types';

function generateTargetName(trialIndex: number): string {
  const timestamp = Date.now().toString(36);
  return `EvalBot-${trialIndex}-${timestamp}`;
}

export const createRenameHappyPath: ScenarioFactory = (
  trialIndex: number,
): Scenario => {
  const targetName = generateTargetName(trialIndex);

  return {
    name: 'rename_happy_path',
    description:
      'Rename the default account to a generated name via the account settings UI.',
    stateMode: 'default',
    taskPrompt: [
      `Verify visually test MetaMask Extension. Rename the currently selected account to exactly: "${targetName}"`,
      '',
      'Steps you will likely need:',
      '1. Use mm describe-screen to understand the current state',
      '2. Navigate to account settings (click the account avatar or menu)',
      '3. Find and click the edit/rename option',
      '4. Clear the existing name and type the new name',
      '5. Confirm/save the change',
      '6. Verify the rename was successful using mm describe-screen',
      '',
      'The task is complete when describe-screen shows the account name',
      `as "${targetName}".`,
    ].join('\n'),
    targetName,
    assertion: {
      type: 'account-renamed',
      expectedName: targetName,
    },
    disallowedBashPatterns: [],
  };
};
