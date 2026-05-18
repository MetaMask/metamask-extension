import fs from 'node:fs';
import path from 'node:path';
import type { TrialResult } from '../types';
import type { EvalConfig } from '../config/schema';
import { runJsonPath, trialDir } from './paths';

export function writeTrialArtifact(
  result: TrialResult,
  config: EvalConfig,
  batchTimestamp: string,
): void {
  const dir = trialDir(
    config.artifactsDir,
    batchTimestamp,
    result.scenario,
    result.trialId,
  );
  fs.mkdirSync(dir, { recursive: true });

  const jsonPath = runJsonPath(
    config.artifactsDir,
    batchTimestamp,
    result.scenario,
    result.trialId,
  );

  const artifact = {
    ...result,
    config: {
      model: config.model,
      maxTurns: config.guardrails.maxTurns,
      maxWallclockMs: config.guardrails.maxWallclockMs,
      coldStart: config.coldStart,
      telemetry: config.telemetry.enabled,
      judge: config.judge.enabled,
      judgeModel: config.judge.enabled ? config.judge.model : undefined,
      toolJudge: config.toolJudge.enabled,
      toolJudgeModel: config.toolJudge.enabled ? config.toolJudge.model : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(jsonPath, JSON.stringify(artifact, null, 2));

  const screenshotsPath = path.join(dir, 'screenshots');
  if (!fs.existsSync(screenshotsPath)) {
    fs.mkdirSync(screenshotsPath, { recursive: true });
  }
}
