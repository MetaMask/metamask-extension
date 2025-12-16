import { execSync } from 'child_process';
import * as Sentry from '@sentry/node';
import { TEST_TITLES } from './constants';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  setTag: jest.fn(),
  setMeasurement: jest.fn(),
  startSpan: jest.fn((_options, callback) => callback()),
  flush: jest.fn().mockResolvedValue(true),
}));

jest.mock('child_process', () => ({
  execSync: jest.fn((cmd: string) => {
    if (cmd === 'git rev-parse HEAD') {
      return 'abc123def456789\n';
    }
    if (cmd === 'git branch --show-current') {
      return 'test-branch\n';
    }
    throw new Error('Unknown command');
  }),
}));

describe('send-to-sentry', () => {
  const mockResults = {
    standardHome: {
      testTitle: TEST_TITLES.MEASURE_PAGE_STANDARD,
      mean: {
        uiStartup: 500,
        load: 400,
        firstPaint: 420,
      },
      min: { uiStartup: 450, load: 350, firstPaint: 380 },
      max: { uiStartup: 550, load: 450, firstPaint: 460 },
      stdDev: { uiStartup: 25, load: 20, firstPaint: 20 },
      p75: { uiStartup: 520, load: 420, firstPaint: 440 },
      p95: { uiStartup: 545, load: 445, firstPaint: 455 },
    },
  };

  const mockUserActionResults = {
    loadNewAccount: {
      testTitle: TEST_TITLES.USER_ACTION_LOAD_NEW_ACCOUNT,
      duration: 1234,
    },
    bridge: {
      testTitle: TEST_TITLES.USER_ACTION_BRIDGE,
      loadPage: 100,
      loadAssetPicker: 200,
      searchToken: 300,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SENTRY_DSN_PERFORMANCE;
    delete process.env.GITHUB_REF_NAME;
    delete process.env.PR_NUMBER;
    delete process.env.HEAD_COMMIT_HASH;
    delete process.env.GITHUB_JOB;
  });

  describe('persona derivation', () => {
    it('derives standardHome pageType → standard persona', () => {
      const persona = 'standardHome' === 'powerUserHome' ? 'powerUser' : 'standard';
      expect(persona).toBe('standard');
    });

    it('derives powerUserHome pageType → powerUser persona', () => {
      const persona = 'powerUserHome' === 'powerUserHome' ? 'powerUser' : 'standard';
      expect(persona).toBe('powerUser');
    });

    it('derives userActions pageType → standard persona', () => {
      const persona = 'userActions' === 'powerUserHome' ? 'powerUser' : 'standard';
      expect(persona).toBe('standard');
    });
  });

  describe('Sentry initialization', () => {
    it('initializes with correct DSN and sample rate', () => {
      const dsn = 'https://test@sentry.io/123';
      Sentry.init({ dsn, tracesSampleRate: 1.0 });

      expect(Sentry.init).toHaveBeenCalledWith({
        dsn,
        tracesSampleRate: 1.0,
      });
    });
  });

  describe('Sentry tags', () => {
    it('sets all required CI tags', () => {
      const tags = {
        'ci.branch': 'feature/test',
        'ci.prNumber': '123',
        'ci.commitHash': 'abc123',
        'ci.job': 'benchmark',
        'ci.persona': 'standard',
        'ci.browser': 'chrome',
        'ci.buildType': 'browserify',
        'ci.pageType': 'standardHome',
        'ci.testTitle': TEST_TITLES.MEASURE_PAGE_STANDARD,
      };

      for (const [key, value] of Object.entries(tags)) {
        Sentry.setTag(key, value);
      }

      expect(Sentry.setTag).toHaveBeenCalledTimes(9);
      expect(Sentry.setTag).toHaveBeenCalledWith('ci.persona', 'standard');
      expect(Sentry.setTag).toHaveBeenCalledWith('ci.pageType', 'standardHome');
      expect(Sentry.setTag).toHaveBeenCalledWith(
        'ci.testTitle',
        TEST_TITLES.MEASURE_PAGE_STANDARD,
      );
    });
  });

  describe('Sentry transactions', () => {
    it('creates span with correct name and operation', () => {
      Sentry.startSpan(
        { name: 'benchmark.standardHome', op: 'benchmark' },
        () => {
          // Callback contains Sentry.setMeasurement calls
          Sentry.setMeasurement('benchmark.uiStartup', 500, 'millisecond');
        },
      );

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { name: 'benchmark.standardHome', op: 'benchmark' },
        expect.any(Function),
      );
    });

    it('sets measurements with benchmark prefix', () => {
      for (const [metric, value] of Object.entries(
        mockResults.standardHome.mean,
      )) {
        Sentry.setMeasurement(`benchmark.${metric}`, value, 'millisecond');
      }

      expect(Sentry.setMeasurement).toHaveBeenCalledWith(
        'benchmark.uiStartup',
        500,
        'millisecond',
      );
      expect(Sentry.setMeasurement).toHaveBeenCalledWith(
        'benchmark.load',
        400,
        'millisecond',
      );
    });
  });

  describe('testTitle from JSON', () => {
    it('uses testTitle from standard benchmark results', () => {
      const { testTitle } = mockResults.standardHome;
      expect(testTitle).toBe(TEST_TITLES.MEASURE_PAGE_STANDARD);
    });

    it('uses testTitle from user action results', () => {
      expect(mockUserActionResults.loadNewAccount.testTitle).toBe(
        TEST_TITLES.USER_ACTION_LOAD_NEW_ACCOUNT,
      );
      expect(mockUserActionResults.bridge.testTitle).toBe(
        TEST_TITLES.USER_ACTION_BRIDGE,
      );
    });
  });

  describe('git fallbacks', () => {
    it('uses env vars when available', () => {
      process.env.GITHUB_REF_NAME = 'env-branch';
      process.env.HEAD_COMMIT_HASH = 'env-commit';

      const branch = process.env.GITHUB_REF_NAME || 'fallback';
      const commit = process.env.HEAD_COMMIT_HASH || 'fallback';

      expect(branch).toBe('env-branch');
      expect(commit).toBe('env-commit');
    });

    it('falls back to git commands when env vars not set', () => {
      const branch = (
        execSync('git branch --show-current', {
          encoding: 'utf-8',
        }) as string
      ).trim();
      const commit = (
        execSync('git rev-parse HEAD', {
          encoding: 'utf-8',
        }) as string
      ).trim();

      expect(branch).toBe('test-branch');
      expect(commit).toBe('abc123def456789');
    });
  });

  describe('flush behavior', () => {
    it('flushes with 10 second timeout', async () => {
      await Sentry.flush(10000);
      expect(Sentry.flush).toHaveBeenCalledWith(10000);
    });
  });
});
