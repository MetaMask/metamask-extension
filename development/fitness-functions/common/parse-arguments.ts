import yargs from 'yargs/yargs';
import { AUTOMATION_TYPE } from './constants';

/**
 * Parses the fitness function CLI options.
 *
 * The optional diff path remains available for running CI rules against a local fixture.
 * @param argumentsForFitnessFunctions - CLI arguments after the script name.
 * @returns The selected automation type, optional diff path, and the labels
 * on the PR being checked.
 */
export function parseFitnessFunctionArguments(
  argumentsForFitnessFunctions: string[],
): {
  automationType: AUTOMATION_TYPE;
  diffPath?: string;
  labels: string[];
} {
  const { automationType, diffPath, labels } = yargs(
    argumentsForFitnessFunctions,
  )
    .command(
      '$0 <automationType> [diffPath]',
      'Run fitness functions',
      (command) =>
        command
          .positional('automationType', {
            describe: 'Automation environment running the fitness functions',
            choices: Object.values(AUTOMATION_TYPE),
            demandOption: true,
          })
          .positional('diffPath', {
            describe: 'Optional diff file for CI runs',
            type: 'string',
          }),
    )
    .option('labels', {
      describe:
        'JSON-encoded array of the labels on the PR being checked. Some fitness functions can be skipped by adding a label to the PR.',
      type: 'string',
      default: '[]',
    })
    .example(
      '$0 ci --labels \'["allow-background-api-changes"]\'',
      'Run fitness functions for a PR which has the allow-background-api-changes label',
    )
    .strict()
    .help()
    .fail((message) => {
      throw new Error(message);
    })
    .parseSync();

  validateAutomationType(automationType);

  return {
    automationType,
    diffPath: typeof diffPath === 'string' ? diffPath : undefined,
    labels: parseLabels(labels),
  };
}

/**
 * Parses the `--labels` argument.
 *
 * Labels are passed as JSON (rather than, say, a comma-separated list)
 * because GitHub Actions can produce JSON from the PR payload directly, and
 * label names may contain commas.
 *
 * @param value - The JSON-encoded array of labels.
 * @returns The labels.
 */
function parseLabels(value: string): string[] {
  const errorMessage = `--labels must be a JSON-encoded array of strings, but got: ${value}`;

  let labels: unknown;
  try {
    labels = JSON.parse(value);
  } catch {
    throw new Error(errorMessage);
  }

  if (
    !Array.isArray(labels) ||
    !labels.every((label) => typeof label === 'string')
  ) {
    throw new Error(errorMessage);
  }

  return labels;
}

/**
 * Type guard for the `automationType` argument.
 *
 * @param value - The possible automation type.
 */
function validateAutomationType(
  value: unknown,
): asserts value is AUTOMATION_TYPE {
  const automationTypes: unknown[] = Object.values(AUTOMATION_TYPE);

  if (!automationTypes.includes(value)) {
    throw new Error(`Invalid automation type: ${String(value)}`);
  }
}
