/**
 * Pre-condition evaluation engine.
 * Evaluates named pre-conditions before recipe steps run. Fails fast with hints.
 */

import type { BrowserContext, Page } from '@playwright/test';
import type { McpResponse } from '@metamask/client-mcp-core';

export type CallHandlerFn = (
  toolName: string,
  input: Record<string, unknown>,
) => Promise<McpResponse<unknown>>;

export type PreConditionContext = {
  getPage: () => Page;
  getContext: () => BrowserContext;
  extensionId: string;
};

export type PreConditionResult = {
  pass: boolean;
  hint: string;
};

export type PreConditionCheck = (
  callHandler: CallHandlerFn,
  params?: Record<string, unknown>,
  context?: PreConditionContext,
) => Promise<PreConditionResult>;

export type PreConditionEntry = {
  description: string;
  check: PreConditionCheck;
};

export type PreConditionRegistry = Record<string, PreConditionEntry>;

export type PreConditionSpec =
  | string
  | { name: string; [key: string]: unknown };

export type RunResult = {
  allPassed: boolean;
  results: {
    name: string;
    pass: boolean;
    hint: string;
    durationMs: number;
  }[];
};

/**
 * Run a list of pre-condition specs against one or more registries.
 * Returns early on first failure.
 *
 * @param conditions - List of pre-condition specs to evaluate
 * @param registries - Pre-condition registries to look up checks
 * @param callHandler - Tool handler caller function
 * @returns Run result with pass/fail for each condition
 */
export async function runPreConditions(
  conditions: PreConditionSpec[],
  registries: PreConditionRegistry[],
  callHandler: CallHandlerFn,
  context?: PreConditionContext,
): Promise<RunResult> {
  const results: RunResult['results'] = [];

  for (const condition of conditions) {
    const name = typeof condition === 'string' ? condition : condition.name;
    const params =
      typeof condition === 'object'
        ? (Object.fromEntries(
            Object.entries(condition).filter(([k]) => k !== 'name'),
          ) as Record<string, unknown>)
        : undefined;

    // Find the check in registries
    let entry: PreConditionEntry | undefined;
    for (const registry of registries) {
      if (registry[name]) {
        entry = registry[name];
        break;
      }
    }

    if (!entry) {
      results.push({
        name,
        pass: false,
        hint: `Unknown pre-condition: "${name}"`,
        durationMs: 0,
      });
      return { allPassed: false, results };
    }

    const start = Date.now();
    try {
      const result = await entry.check(callHandler, params, context);
      const durationMs = Date.now() - start;
      results.push({ name, pass: result.pass, hint: result.hint, durationMs });

      if (!result.pass) {
        return { allPassed: false, results };
      }
    } catch (err) {
      const durationMs = Date.now() - start;
      results.push({
        name,
        pass: false,
        hint: `Pre-condition threw: ${err instanceof Error ? err.message : String(err)}`,
        durationMs,
      });
      return { allPassed: false, results };
    }
  }

  return { allPassed: true, results };
}
