import {
  DEFAULT_LIMIT,
  HELP_TEXT,
  parseCliArgs,
  type CliOptions,
} from './args';

function parseRun(
  argv: string[],
  context?: { env?: NodeJS.ProcessEnv; isTTY?: boolean },
): CliOptions {
  const result = parseCliArgs(argv, context);
  if (result.kind !== 'run') {
    throw new Error(`Expected a run result, got ${JSON.stringify(result)}`);
  }
  return result.options;
}

describe('parseCliArgs', () => {
  describe('command', () => {
    it('defaults to index when no positional is given', () => {
      expect(parseRun([]).command).toBe('index');
    });

    it('accepts overlaps as the positional command', () => {
      expect(parseRun(['overlaps']).command).toBe('overlaps');
    });

    it('returns an error for an unknown command', () => {
      expect(parseCliArgs(['lint'])).toStrictEqual({
        kind: 'error',
        message: 'Unknown command: lint',
      });
    });

    it('returns an error when extra positionals are given', () => {
      expect(parseCliArgs(['index', 'overlaps'])).toStrictEqual({
        kind: 'error',
        message: 'Unexpected arguments: overlaps',
      });
    });
  });

  describe('help', () => {
    it('returns help when --help is passed', () => {
      expect(parseCliArgs(['--help'])).toStrictEqual({ kind: 'help' });
    });

    it('returns help when -h is passed', () => {
      expect(parseCliArgs(['-h'])).toStrictEqual({ kind: 'help' });
    });

    it('exports usage that names both yarn scripts', () => {
      expect(HELP_TEXT).toContain('yarn page-objects:index');
      expect(HELP_TEXT).toContain('yarn page-objects:overlaps');
    });
  });

  describe('filters', () => {
    it('composes --filter, --search, and --file', () => {
      const options = parseRun([
        'overlaps',
        '--filter',
        'shadowing',
        '--filter',
        'sibling',
        '--search',
        'sort-by-networks',
        '--file',
        'home',
        '--class',
        'HomePage',
      ]);

      expect(options.filters).toStrictEqual(['shadowing', 'sibling']);
      expect(options.search).toBe('sort-by-networks');
      expect(options.file).toBe('home');
      expect(options.className).toBe('HomePage');
    });

    it('returns an error for an invalid --filter', () => {
      expect(parseCliArgs(['--filter', 'expected'])).toStrictEqual({
        kind: 'error',
        message:
          'Invalid --filter: expected. Expected shadowing, sibling, or cross-family.',
      });
    });

    it('returns an error for an invalid --fail-on', () => {
      expect(parseCliArgs(['--fail-on', 'all'])).toStrictEqual({
        kind: 'error',
        message:
          'Invalid --fail-on: all. Expected shadowing, sibling, or cross-family.',
      });
    });
  });

  describe('limit', () => {
    it('defaults the per-classification cap to 10', () => {
      expect(parseRun([]).limit).toBe(DEFAULT_LIMIT);
    });

    it('honors --limit', () => {
      expect(parseRun(['--limit', '5']).limit).toBe(5);
    });

    it('treats --all as unlimited even when --limit is also passed', () => {
      expect(parseRun(['--limit', '5', '--all']).limit).toBeNull();
    });

    it('returns an error for a non-positive --limit', () => {
      expect(parseCliArgs(['--limit', '0'])).toStrictEqual({
        kind: 'error',
        message: 'Invalid --limit: 0. Expected a positive integer.',
      });
    });
  });

  describe('color', () => {
    it('enables color on a TTY when NO_COLOR is unset', () => {
      expect(parseRun([], { env: {}, isTTY: true }).color).toBe(true);
    });

    it('disables color when --no-color is passed', () => {
      expect(
        parseRun(['--no-color'], { env: {}, isTTY: true }).color,
      ).toBe(false);
    });

    it('disables color when NO_COLOR is set', () => {
      expect(
        parseRun([], { env: { NO_COLOR: '1' }, isTTY: true }).color,
      ).toBe(false);
    });

    it('disables color when stdout is not a TTY', () => {
      expect(parseRun([], { env: {}, isTTY: false }).color).toBe(false);
    });
  });

  describe('fail-on', () => {
    it('records --fail-on-overlap', () => {
      expect(parseRun(['--fail-on-overlap']).failOnOverlap).toBe(true);
    });

    it('records repeatable --fail-on classifications', () => {
      expect(
        parseRun(['--fail-on', 'shadowing', '--fail-on', 'sibling']).failOn,
      ).toStrictEqual(['shadowing', 'sibling']);
    });
  });

  describe('unknown flags', () => {
    it('returns an error for an unknown option', () => {
      expect(parseCliArgs(['--unused'])).toStrictEqual(
        expect.objectContaining({
          kind: 'error',
          message: expect.stringContaining('unused'),
        }),
      );
    });
  });
});
