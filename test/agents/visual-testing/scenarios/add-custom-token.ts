import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { Scenario, ScenarioFactory, ScenarioSetupResult } from './types';

const HST_CONTRACT_NAME = 'hst';
const HST_TOKEN_SYMBOL = 'TST';
const ADDRESS_PLACEHOLDER = '<CONTRACT_ADDRESS>';

function mm(args: string[], cwd: string): string {
  return execFileSync(path.join(cwd, 'node_modules', '.bin', 'mm'), args, {
    cwd,
    encoding: 'utf-8',
    timeout: 60_000,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
}

function deployHstContract(cwd: string): string {
  mm(['seed-contract', HST_CONTRACT_NAME], cwd);
  const output = mm(['get-contract-address', HST_CONTRACT_NAME], cwd);
  const parsed = JSON.parse(output);
  const address = parsed.address ?? parsed.result ?? output.trim();
  if (!address || typeof address !== 'string') {
    throw new Error(
      `Failed to get ${HST_CONTRACT_NAME} contract address from: ${output}`,
    );
  }
  return address;
}

function buildTaskPrompt(contractAddress: string): string {
  return [
    `Verify visually test MetaMask Extension. Import the ERC-20 token at contract address ${contractAddress} into MetaMask.`,
    '',
    'Steps you will likely need:',
    '1. Use mm describe-screen to see the current home screen',
    '2. Find the "Import tokens" option (usually at the bottom of the token list)',
    '3. Select the "Custom token" tab if needed',
    `4. Enter the contract address: ${contractAddress}`,
    '5. Wait for token details to auto-populate, or enter the symbol and decimals manually',
    '6. Confirm the import',
    '7. Verify the token appears in your token list on the home screen',
    '',
    `The task is complete when the token "${HST_TOKEN_SYMBOL}" is visible in the token list.`,
  ].join('\n');
}

export const createAddCustomToken: ScenarioFactory = (): Scenario => {
  return {
    name: 'add_custom_token',
    description:
      'Import an ERC-20 token by contract address and verify it appears in the token list.',
    difficulty: 'medium',
    stateMode: 'default',
    taskPrompt: buildTaskPrompt(ADDRESS_PLACEHOLDER),
    assertion: {
      type: 'screen-contains',
      text: HST_TOKEN_SYMBOL,
    },
    disallowedBashPatterns: [],
    beforeAgent(cwd: string): ScenarioSetupResult {
      const contractAddress = deployHstContract(cwd);
      return {
        taskPromptOverride: buildTaskPrompt(contractAddress),
      };
    },
  };
};
