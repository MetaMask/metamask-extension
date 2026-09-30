import { AUTOMATION_TYPE } from './constants';
import { parseFitnessFunctionArguments } from './parse-arguments';

describe('parseFitnessFunctionArguments', () => {
  it('parses a JSON-encoded array of labels', () => {
    const options = parseFitnessFunctionArguments([
      'ci',
      '--labels',
      '["team-core-platform", "allow-background-api-changes"]',
    ]);

    expect(options).toStrictEqual({
      automationType: AUTOMATION_TYPE.CI,
      diffPath: undefined,
      labels: ['team-core-platform', 'allow-background-api-changes'],
    });
  });

  it('preserves the optional CI diff path alongside labels', () => {
    const options = parseFitnessFunctionArguments([
      'ci',
      '/tmp/fitness.diff',
      '--labels',
      '["allow-background-api-changes"]',
    ]);

    expect(options).toStrictEqual({
      automationType: AUTOMATION_TYPE.CI,
      diffPath: '/tmp/fitness.diff',
      labels: ['allow-background-api-changes'],
    });
  });

  it('defaults to no labels', () => {
    const options = parseFitnessFunctionArguments(['ci']);

    expect(options.labels).toStrictEqual([]);
  });

  it('throws when labels are not valid JSON', () => {
    expect(() =>
      parseFitnessFunctionArguments(['ci', '--labels', 'not-json']),
    ).toThrow('--labels must be a JSON-encoded array of strings');
  });

  it('throws when labels are not an array of strings', () => {
    expect(() =>
      parseFitnessFunctionArguments(['ci', '--labels', '["valid", 1]']),
    ).toThrow('--labels must be a JSON-encoded array of strings');
  });

  it('rejects unknown flags', () => {
    expect(() => parseFitnessFunctionArguments(['ci', '--unknown'])).toThrow(
      'Unknown argument: unknown',
    );
  });
});
