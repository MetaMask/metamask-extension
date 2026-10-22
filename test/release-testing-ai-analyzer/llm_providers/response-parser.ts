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
  'test runner',
  'test fixture',
  'test setup',
  'test configuration',
  'unit test',
  'e2e test',
  'jest',
  'playwright',
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
 * Keeps a replacement's first letter aligned with the matched phrase.
 *
 * @param source
 * @param replacement
 */
function matchLeadingCase(source: string, replacement: string): string {
  const startsWithUppercase =
    source[0] === source[0]?.toUpperCase() &&
    source[0] !== source[0]?.toLowerCase();
  if (!startsWithUppercase) {
    return replacement;
  }
  return replacement.charAt(0).toUpperCase() + replacement.slice(1);
}

/**
 * Rewrites steps that tell testers to use settings toggles removed by Basic
 * Functionality consolidation. NFT detection, token detection, and NFT media
 * follow the Basic functionality toggle.
 *
 * @param text
 * @returns text that refers to Basic functionality instead of the removed toggles
 */
export function rewriteRemovedSettingsToggles(text: string): string {
  const replacePhrase = (pattern: RegExp, replacement: string) =>
    text.replace(pattern, (match) => matchLeadingCase(match, replacement));

  let rewritten = replacePhrase(
    /\btoggle\s+nft\s+auto-?detection\s+off\s+and\s+on\b/giu,
    'toggle Basic functionality OFF and ON',
  );
  rewritten = rewritten.replace(
    /\btoggle\s+token\s+auto-?detection\s+off\s+and\s+on\b/giu,
    (match) => matchLeadingCase(match, 'toggle Basic functionality OFF and ON'),
  );
  rewritten = rewritten.replace(
    /\btoggle\s+auto-?detect\s+off\s+and\s+on\b/giu,
    (match) => matchLeadingCase(match, 'toggle Basic functionality OFF and ON'),
  );
  rewritten = rewritten.replace(
    /\bturn\s+(off|on)\s+nft\s+auto-?detection(\s+in\s+settings)?\b/giu,
    (match, onOff: string, inSettings: string | undefined) => {
      const state = onOff.toLowerCase() === 'off' ? 'OFF' : 'ON';
      const where = inSettings ? ' in Settings → Security & privacy' : '';
      return matchLeadingCase(
        match,
        `turn ${state} Basic functionality${where}`,
      );
    },
  );
  rewritten = rewritten.replace(/\bturn\s+on\s+nft\s+detection\b/giu, (match) =>
    matchLeadingCase(match, 'turn ON Basic functionality'),
  );
  rewritten = rewritten.replace(
    /\bnft\s+auto-?detection\s+remains\s+(off|on)\b/giu,
    (_match, state: string) =>
      `Basic functionality remains ${state.toUpperCase()} (NFT detection follows it)`,
  );
  rewritten = rewritten.replace(
    /\b(nft\s+auto-?detect(?:ion)?|autodetect\s+nfts|token\s+auto-?detection|autodetect\s+tokens|display\s+nft\s+media)\s+toggle\b/giu,
    'Basic functionality toggle',
  );
  rewritten = rewritten.replace(
    /\btoggle\s+(?:the\s+)?(nft\s+auto-?detect(?:ion)?|autodetect\s+nfts|token\s+auto-?detection|autodetect\s+tokens|display\s+nft\s+media)\b/giu,
    (match) => matchLeadingCase(match, 'toggle Basic functionality'),
  );
  rewritten = rewritten.replace(
    /\b(?:nft\s+|token\s+)?auto-?detection\s+is\s+(off|on)\b/giu,
    (_match, state: string) => `Basic functionality is ${state.toUpperCase()}`,
  );
  rewritten = rewritten.replace(
    /\bnft\s+auto-?detection\b/giu,
    'Basic functionality',
  );
  rewritten = rewritten.replace(
    /\bnft\s+auto-?detect\b/giu,
    'Basic functionality',
  );

  return rewritten;
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
      area: rewriteRemovedSettingsToggles(scenario.area),
      whyThisMatters: rewriteRemovedSettingsToggles(scenario.whyThisMatters),
      testSteps: normalizeTestSteps(
        scenario.testSteps.map(rewriteRemovedSettingsToggles),
      ),
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
