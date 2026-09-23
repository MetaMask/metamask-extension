import yargs from 'yargs/yargs';
import { AUTOMATION_TYPE } from './constants';

/**
 * Parses the fitness function CLI options.
 *
 * The optional diff path remains available for running CI rules against a local fixture.
 * @param argumentsForFitnessFunctions - CLI arguments after the script name.
 * @returns The selected automation and optional CI overrides.
 */
export function parseFitnessFunctionArguments(
  argumentsForFitnessFunctions: string[],
): {
  automationType: AUTOMATION_TYPE;
  diffPath?: string;
  allowBackgroundApiChanges: boolean;
} {
  const options = yargs(argumentsForFitnessFunctions)
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
    .option('allowBackgroundApiChanges', {
      describe:
        'Skip fitness functions which guard against expanding the legacy background API',
      type: 'boolean',
      default: false,
    })
    .strict()
    .help()
    .fail((message) => {
      throw new Error(message);
    })
    .parseSync();

  return {
    automationType: getAutomationType(options.automationType),
    diffPath:
      typeof options.diffPath === 'string' ? options.diffPath : undefined,
    allowBackgroundApiChanges: options.allowBackgroundApiChanges,
  };
}

function getAutomationType(value: unknown): AUTOMATION_TYPE {
  for (const automationType of Object.values(AUTOMATION_TYPE)) {
    if (value === automationType) {
      return automationType;
    }
  }
  throw new Error(`Invalid automation type: ${String(value)}`);
}
