import { AUTOMATION_TYPE } from './constants';
import { parseFitnessFunctionArguments } from './parse-arguments';

describe('parseFitnessFunctionArguments', () => {
  it('accepts the CI bypass flag', () => {
    const argumentsForFitnessFunctions = [
      'ci',
      '--allow-background-api-changes',
    ];

    const options = parseFitnessFunctionArguments(argumentsForFitnessFunctions);

    expect(options).toStrictEqual({
      automationType: AUTOMATION_TYPE.CI,
      allowBackgroundApiChanges: true,
      diffPath: undefined,
    });
  });

  it('preserves the optional CI diff path alongside the bypass flag', () => {
    const argumentsForFitnessFunctions = [
      'ci',
      '/tmp/fitness.diff',
      '--allow-background-api-changes',
    ];

    const options = parseFitnessFunctionArguments(argumentsForFitnessFunctions);

    expect(options).toStrictEqual({
      automationType: AUTOMATION_TYPE.CI,
      allowBackgroundApiChanges: true,
      diffPath: '/tmp/fitness.diff',
    });
  });

  it('keeps the legacy API guards enabled by default', () => {
    const options = parseFitnessFunctionArguments(['ci']);

    expect(options.allowBackgroundApiChanges).toBe(false);
  });

  it('rejects unknown flags', () => {
    expect(() => parseFitnessFunctionArguments(['ci', '--unknown'])).toThrow(
      'Unknown argument: unknown',
    );
  });
});
