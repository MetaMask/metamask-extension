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

export function checkAssertion(
  assertion: ScenarioAssertion,
  cwd: string,
): AssertionResult {
  if (assertion.type === 'account-renamed') {
    return checkAccountRenamed(assertion.expectedName, cwd);
  }

  return {
    passed: false,
    expected: 'known assertion type',
    actual: assertion.type,
    detail: `Unknown assertion type: ${assertion.type}`,
  };
}

function checkAccountRenamed(
  expectedName: string,
  cwd: string,
): AssertionResult {
  let screenOutput: string;
  try {
    screenOutput = mm(['describe-screen'], cwd);
  } catch (err) {
    return {
      passed: false,
      expected: expectedName,
      actual: undefined,
      detail: `describe-screen failed: ${err}`,
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

  const match = screenOutput.match(/Account\s*(?:name)?[:\s]+["']?([^"'\n]+)/i);
  return match?.[1]?.trim();
}
