import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { AssertionResult } from '../types';
import type { ScenarioAssertion } from '../scenarios/types';

function mm(args: string[], cwd: string): string {
  return execFileSync(path.join(cwd, 'node_modules', '.bin', 'mm'), args, {
    cwd,
    encoding: 'utf-8',
    timeout: 30_000,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
}

function getScreenOutput(cwd: string): string {
  return mm(['describe-screen'], cwd);
}

export function checkAssertion(
  assertion: ScenarioAssertion,
  cwd: string,
): AssertionResult {
  switch (assertion.type) {
    case 'account-renamed':
      return checkAccountRenamed(assertion.expectedName, cwd);
    case 'screen-contains':
      return checkScreenContains(assertion.text, cwd);
    case 'network-switched':
      return checkNetworkSwitched(assertion.expectedNetwork, cwd);
    default:
      return {
        passed: false,
        expected: 'known assertion type',
        actual: (assertion as { type: string }).type,
        detail: `Unknown assertion type: ${(assertion as { type: string }).type}`,
      };
  }
}

function checkScreenContains(text: string, cwd: string): AssertionResult {
  let screenOutput: string;
  try {
    screenOutput = getScreenOutput(cwd);
  } catch (err) {
    return {
      passed: false,
      expected: text,
      actual: undefined,
      detail: `describe-screen failed: ${String(err)}`,
    };
  }

  const found = screenOutput.toLowerCase().includes(text.toLowerCase());

  return {
    passed: found,
    expected: text,
    actual: found ? text : truncate(screenOutput, 200),
    detail: found
      ? `Text "${text}" found in screen output`
      : `Text "${text}" not found in screen output`,
  };
}

function checkNetworkSwitched(
  expectedNetwork: string,
  cwd: string,
): AssertionResult {
  let screenOutput: string;
  try {
    screenOutput = getScreenOutput(cwd);
  } catch (err) {
    return {
      passed: false,
      expected: expectedNetwork,
      actual: undefined,
      detail: `describe-screen failed: ${String(err)}`,
    };
  }

  const normalizedOutput = screenOutput.toLowerCase();
  const normalizedExpected = expectedNetwork.toLowerCase();
  const found = normalizedOutput.includes(normalizedExpected);

  let actualNetwork: string | undefined;
  if (!found) {
    actualNetwork = extractField(screenOutput, [
      'network',
      'networkName',
      'network_name',
      'chainName',
    ]);
  }

  return {
    passed: found,
    expected: expectedNetwork,
    actual: found ? expectedNetwork : actualNetwork,
    detail: found
      ? `Network "${expectedNetwork}" found in screen output`
      : `Network "${expectedNetwork}" not found in screen output`,
  };
}

function checkSettingToggled(
  settingName: string,
  expectedState: boolean,
  cwd: string,
): AssertionResult {
  let screenOutput: string;
  try {
    screenOutput = getScreenOutput(cwd);
  } catch (err) {
    return {
      passed: false,
      expected: `${settingName} = ${String(expectedState)}`,
      actual: undefined,
      detail: `describe-screen failed: ${String(err)}`,
    };
  }

  const normalizedOutput = screenOutput.toLowerCase();
  const hasSettingName = normalizedOutput.includes(settingName.toLowerCase());
  const stateIndicator = expectedState ? 'on' : 'off';
  const found = hasSettingName && normalizedOutput.includes(stateIndicator);

  return {
    passed: found,
    expected: `${settingName} = ${String(expectedState)}`,
    actual: found ? `${settingName} = ${String(expectedState)}` : truncate(screenOutput, 200),
    detail: found
      ? `Setting "${settingName}" is ${stateIndicator}`
      : `Setting "${settingName}" state "${stateIndicator}" not confirmed in screen output`,
  };
}

function checkNavigationReached(
  expectedScreen: string,
  cwd: string,
): AssertionResult {
  let screenOutput: string;
  try {
    screenOutput = getScreenOutput(cwd);
  } catch (err) {
    return {
      passed: false,
      expected: expectedScreen,
      actual: undefined,
      detail: `describe-screen failed: ${String(err)}`,
    };
  }

  const found = screenOutput
    .toLowerCase()
    .includes(expectedScreen.toLowerCase());

  return {
    passed: found,
    expected: expectedScreen,
    actual: found ? expectedScreen : truncate(screenOutput, 200),
    detail: found
      ? `Screen "${expectedScreen}" reached`
      : `Screen "${expectedScreen}" not found in screen output`,
  };
}

function checkAccountRenamed(
  expectedName: string,
  cwd: string,
): AssertionResult {
  let screenOutput: string;
  try {
    screenOutput = getScreenOutput(cwd);
  } catch (err) {
    return {
      passed: false,
      expected: expectedName,
      actual: undefined,
      detail: `describe-screen failed: ${String(err)}`,
    };
  }

  const normalizedOutput = screenOutput.toLowerCase();
  const normalizedExpected = expectedName.toLowerCase();
  const found = normalizedOutput.includes(normalizedExpected);

  return {
    passed: found,
    expected: expectedName,
    actual: found ? expectedName : extractAccountName(screenOutput),
    detail: found
      ? `Account name "${expectedName}" found in screen output`
      : `Account name "${expectedName}" not found in screen output`,
  };
}

function extractAccountName(screenOutput: string): string | undefined {
  try {
    const parsed = JSON.parse(screenOutput);
    if (typeof parsed.accountName === 'string') {
      return parsed.accountName;
    }
    if (typeof parsed.account_name === 'string') {
      return parsed.account_name;
    }
  } catch {
    /* screen output may not be JSON */
  }

  const match = screenOutput.match(/Account\s*(?:name)?[:\s]+["']?([^"'\n]+)/iu);
  return match?.[1]?.trim();
}

function extractField(
  screenOutput: string,
  fieldNames: string[],
): string | undefined {
  try {
    const parsed = JSON.parse(screenOutput);
    for (const name of fieldNames) {
      if (typeof parsed[name] === 'string') {
        return parsed[name];
      }
    }
  } catch {
    /* screen output may not be JSON */
  }
  return undefined;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) {
    return str;
  }
  return `${str.slice(0, maxLen)}...`;
}
