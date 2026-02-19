/**
 * Shared response parsing utilities for all LLM analyzers
 */

import type { LLMAnalysisResponse, TestingScenario } from '../types';

/**
 * Phrases that indicate build/infrastructure-only scenarios that should be excluded.
 * Uses specific phrases to avoid false positives (e.g. "config" would incorrectly
 * exclude "Network Configuration", "workflow" would exclude "Onboarding Workflow").
 */
const EXCLUDE_PHRASES = [
  'build system',
  'build script',
  'build configuration',
  'webpack',
  'browserify',
  'eslint',
  'prettier',
  'changelog',
  'storybook',
  'ci/cd',
  'github actions',
  'github workflow',
  'package.json',
  'yarn.lock',
  'tsconfig',
  'linting',
  'code formatting',
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

  // Filter out build/infrastructure-only scenarios (avoid broad terms like "config" or "workflow")
  const areaLower = scenario.area.toLowerCase();
  if (EXCLUDE_PHRASES.some((phrase) => areaLower.includes(phrase))) {
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
 * Filters, validates, and normalizes a list of scenarios
 *
 * @param scenarios - Raw scenarios from LLM response
 * @returns Filtered and normalized scenarios
 */
function processScenarios(scenarios: TestingScenario[]): TestingScenario[] {
  return scenarios
    .filter((scenario: TestingScenario) => {
      validateScenario(scenario);
      return !shouldExcludeScenario(scenario);
    })
    .sort(sortByRiskLevel)
    .map((scenario) => ({
      ...scenario,
      testSteps: normalizeTestSteps(scenario.testSteps),
    }));
}

/**
 * Validates and normalizes an LLM analysis response
 *
 * @param parsed - Raw LLM response to validate
 * @returns Validated and normalized response
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

  parsed.scenarios = processScenarios(parsed.scenarios);

  if (parsed.cherryPickScenarios && Array.isArray(parsed.cherryPickScenarios)) {
    parsed.cherryPickScenarios = processScenarios(parsed.cherryPickScenarios);
  } else {
    parsed.cherryPickScenarios = [];
  }

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
