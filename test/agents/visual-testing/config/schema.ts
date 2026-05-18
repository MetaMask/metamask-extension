export type EvalConfig = {
  scenario: string;
  trials: number;
  model: string;
  telemetry: { enabled: boolean; serviceName: string };
  judge: { enabled: boolean; model: string };
  toolJudge: { enabled: boolean; model: string };
  guardrails: { maxWallclockMs: number; maxTurns: number };
  coldStart: boolean;
  artifactsDir: string;
  extensionCwd: string;
};

export function validateConfig(config: EvalConfig): string[] {
  const errors: string[] = [];

  if (config.trials < 1) {
    errors.push(`trials must be >= 1, got ${config.trials}`);
  }
  if (config.guardrails.maxTurns < 1) {
    errors.push(`maxTurns must be >= 1, got ${config.guardrails.maxTurns}`);
  }
  if (config.guardrails.maxWallclockMs < 1000) {
    errors.push(
      `maxWallclockMs must be >= 1000, got ${config.guardrails.maxWallclockMs}`,
    );
  }
  if (!config.model) {
    errors.push('model must be specified');
  }
  if (!config.scenario) {
    errors.push('scenario must be specified');
  }

  return errors;
}
