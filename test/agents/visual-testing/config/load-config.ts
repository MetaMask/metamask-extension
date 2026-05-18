import { execSync } from 'node:child_process';
import path from 'node:path';
import {
  ARTIFACTS_BASE_DIR,
  DEFAULT_JUDGE_MODEL,
  DEFAULT_MAX_TURNS,
  DEFAULT_MAX_WALLCLOCK_MS,
  DEFAULT_MODEL,
  DEFAULT_SCENARIO,
  DEFAULT_SERVICE_NAME,
  DEFAULT_TOOL_JUDGE_MODEL,
  DEFAULT_TRIALS,
} from '../constants';
import type { EvalConfig } from './schema';
import { validateConfig } from './schema';

type CliArgs = {
  scenario?: string;
  trials?: number;
  model?: string;
  telemetry?: boolean;
  judge?: boolean;
  judgeModel?: string;
  toolJudge?: boolean;
  toolJudgeModel?: string;
  maxTurns?: number;
  maxWallclockMs?: number;
  coldStart?: boolean;
};

export function loadConfig(args: CliArgs): EvalConfig {
  const extensionCwd = findExtensionRoot();

  const config: EvalConfig = {
    scenario: args.scenario ?? env('EVAL_SCENARIO') ?? DEFAULT_SCENARIO,
    trials: args.trials ?? envInt('EVAL_TRIALS') ?? DEFAULT_TRIALS,
    model: args.model ?? env('EVAL_MODEL') ?? DEFAULT_MODEL,
    telemetry: {
      enabled: args.telemetry ?? envBool('EVAL_TELEMETRY') ?? true,
      serviceName: env('EVAL_SERVICE_NAME') ?? DEFAULT_SERVICE_NAME,
    },
    judge: {
      enabled: args.judge ?? envBool('EVAL_JUDGE') ?? false,
      model: args.judgeModel ?? env('EVAL_JUDGE_MODEL') ?? DEFAULT_JUDGE_MODEL,
    },
    toolJudge: {
      enabled: args.toolJudge ?? envBool('EVAL_TOOL_JUDGE') ?? false,
      model: args.toolJudgeModel ?? env('EVAL_TOOL_JUDGE_MODEL') ?? DEFAULT_TOOL_JUDGE_MODEL,
    },
    guardrails: {
      maxWallclockMs:
        args.maxWallclockMs ??
        envInt('EVAL_MAX_WALLCLOCK_MS') ??
        DEFAULT_MAX_WALLCLOCK_MS,
      maxTurns:
        args.maxTurns ?? envInt('EVAL_MAX_TURNS') ?? DEFAULT_MAX_TURNS,
    },
    coldStart: args.coldStart ?? envBool('EVAL_COLD_START') ?? true,
    artifactsDir: path.resolve(extensionCwd, ARTIFACTS_BASE_DIR),
    extensionCwd,
  };

  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid eval config:\n  ${errors.join('\n  ')}`);
  }

  return config;
}

function findExtensionRoot(): string {
  return execSync('git rev-parse --show-toplevel', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function env(key: string): string | undefined {
  return process.env[key] || undefined;
}

function envInt(key: string): number | undefined {
  const val = process.env[key];
  if (val === undefined) {
    return undefined;
  }
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function envBool(key: string): boolean | undefined {
  const val = process.env[key];
  if (val === undefined) {
    return undefined;
  }
  return val === 'true' || val === '1';
}
