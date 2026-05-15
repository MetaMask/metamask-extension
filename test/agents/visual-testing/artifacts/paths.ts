import path from 'node:path';

export function batchDir(artifactsBase: string, batchTimestamp: string): string {
  return path.join(artifactsBase, batchTimestamp);
}

export function trialDir(
  artifactsBase: string,
  batchTimestamp: string,
  scenario: string,
  trialId: string,
): string {
  return path.join(artifactsBase, batchTimestamp, scenario, trialId);
}

export function screenshotsDir(
  artifactsBase: string,
  batchTimestamp: string,
  scenario: string,
  trialId: string,
): string {
  return path.join(trialDir(artifactsBase, batchTimestamp, scenario, trialId), 'screenshots');
}

export function runJsonPath(
  artifactsBase: string,
  batchTimestamp: string,
  scenario: string,
  trialId: string,
): string {
  return path.join(trialDir(artifactsBase, batchTimestamp, scenario, trialId), 'run.json');
}

export function summaryJsonPath(
  artifactsBase: string,
  batchTimestamp: string,
): string {
  return path.join(batchDir(artifactsBase, batchTimestamp), 'summary.json');
}

export function summaryMdPath(
  artifactsBase: string,
  batchTimestamp: string,
): string {
  return path.join(batchDir(artifactsBase, batchTimestamp), 'summary.md');
}

export function generateTrialId(index: number): string {
  return `trial-${String(index).padStart(3, '0')}`;
}

export function generateBatchTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
