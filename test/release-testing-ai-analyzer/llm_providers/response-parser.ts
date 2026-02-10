/**
 * Shared response parsing utilities for all LLM analyzers
 */

import type { LLMAnalysisResponse, TestingScenario } from '../types';

/**
 * Keywords that indicate build/configuration scenarios that should be excluded
 */
const EXCLUDE_KEYWORDS = [
  'build',
  'configuration',
  'config',
  'prettier',
  'eslint',
  'linting',
  'formatting',
  'changelog',
  'storybook',
  'ci/cd',
  'github actions',
  'workflow',
  'package.json',
  'yarn.lock',
  'tsconfig',
  'webpack',
  'browserify',
] as const;

/**
 * Validates that a scenario has all required fields
 *
 * @param scenario
 * @throws Error if scenario is missing required fields
 */
function validateScenario(scenario: TestingScenario): void {
  if (
    !scenario.area ||
    !scenario.riskLevel ||
    !scenario.testSteps ||
    !scenario.whyThisMatters
  ) {
    throw new Error(`Invalid scenario: missing required fields`);
  }
}

/**
 * Checks if a scenario should be excluded based on build/configuration keywords
 *
 * @param scenario
 * @returns true if scenario should be excluded
 */
function shouldExcludeScenario(scenario: TestingScenario): boolean {
  // Filter out low risk scenarios
  if (!['high', 'medium'].includes(scenario.riskLevel)) {
    return true;
  }

  // Filter out build/configuration scenarios
  const areaLower = scenario.area.toLowerCase();
  if (EXCLUDE_KEYWORDS.some((keyword) => areaLower.includes(keyword))) {
    return true;
  }

  return false;
}

/**
 * Sorts scenarios by risk level (high first, then medium)
 *
 * @param a
 * @param b
 * @returns sort comparison value
 */
function sortByRiskLevel(a: TestingScenario, b: TestingScenario): number {
  if (a.riskLevel === 'high' && b.riskLevel === 'medium') {
    return -1;
  }
  if (a.riskLevel === 'medium' && b.riskLevel === 'high') {
    return 1;
  }
  return 0;
}

/**
 * Normalizes test step numbering to ensure each step starts with "1. ", "2. ", etc.
 *
 * @param steps
 * @returns normalized steps with correct numbering
 */
function normalizeTestSteps(steps: string[]): string[] {
  return steps.map((step, index) => {
    const stepNumber = index + 1;
    const trimmedStep = step.trim();
    // If step doesn't start with a number, add it
    if (!/^\d+\.\s/u.test(trimmedStep)) {
      return `${stepNumber}. ${trimmedStep}`;
    }
    // If step has a number, ensure it's the correct one
    return trimmedStep.replace(/^\d+\.\s/u, `${stepNumber}. `);
  });
}

/**
 * Validates and normalizes an LLM analysis response
 * - Validates structure
 * - Filters out invalid, low-risk, and build/config scenarios
 * - Sorts by risk level
 * - Normalizes test step numbering
 *
 * @param parsed
 * @returns validated and normalized response
 * @throws Error if response structure is invalid
 */
export function validateAndNormalizeResponse(
  parsed: LLMAnalysisResponse,
): LLMAnalysisResponse {
  // Validate structure
  if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) {
    throw new Error('Invalid response: missing scenarios array');
  }

  if (!parsed.summary || typeof parsed.summary !== 'string') {
    throw new Error('Invalid response: missing summary');
  }

  // Validate each scenario, filter out low risk and build/config changes, and sort by risk level
  parsed.scenarios = parsed.scenarios
    .filter((scenario: TestingScenario) => {
      validateScenario(scenario);
      return !shouldExcludeScenario(scenario);
    })
    .sort(sortByRiskLevel);

  // Ensure test steps are numbered correctly (1., 2., 3., etc.)
  parsed.scenarios.forEach((scenario: TestingScenario) => {
    scenario.testSteps = normalizeTestSteps(scenario.testSteps);
  });

  return parsed;
}

/**
 * Extracts JSON from a response that may be wrapped in markdown code blocks
 *
 * @param responseText
 * @returns extracted JSON text
 */
export function extractJSONFromResponse(responseText: string): string {
  let jsonText = responseText.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    const lines = jsonText.split('\n');
    const startIndex = lines.findIndex((line) => line.includes('{'));
    const endIndex = lines.findLastIndex((line) => line.includes('}'));
    jsonText = lines.slice(startIndex, endIndex + 1).join('\n');
  }

  return jsonText;
}
