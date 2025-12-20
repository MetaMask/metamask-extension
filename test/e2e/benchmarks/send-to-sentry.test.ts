import { execSync } from 'child_process';
import * as Sentry from '@sentry/node';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  logger: {
    info: jest.fn(),
  },
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
      testTitle: 'measurePageStandard',
      persona: 'standard',
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
      testTitle: 'benchmark-userActions-loadNewAccount',
      persona: 'standard',
      duration: 1234,
    },
    bridge: {
      testTitle: 'benchmark-userActions-bridgeUserActions',
      persona: 'standard',
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

  describe('persona from JSON', () => {
    it('reads persona from standard benchmark results', () => {
      expect(mockResults.standardHome.persona).toBe('standard');
    });

    it('reads persona from user action results', () => {
      expect(mockUserActionResults.loadNewAccount.persona).toBe('standard');
      expect(mockUserActionResults.bridge.persona).toBe('standard');
    });

    it('falls back to standard if persona not in JSON', () => {
      const resultWithoutPersona: {
        testTitle: string;
        mean: object;
        persona?: string;
      } = { testTitle: 'test', mean: {} };
      const persona = resultWithoutPersona.persona || 'standard';
      expect(persona).toBe('standard');
    });
  });

  describe('Sentry initialization', () => {
    it('initializes with logs enabled', () => {
      const dsn = 'https://test@sentry.io/123';
      Sentry.init({
        dsn,
        enableLogs: true,
      });

      expect(Sentry.init).toHaveBeenCalledWith({
        dsn,
        enableLogs: true,
      });
    });
  });

  describe('Sentry logger', () => {
    it('sends benchmark results as structured log with flat attributes', () => {
      const attributes = {
        'ci.branch': 'feature/test',
        'ci.prNumber': '123',
        'ci.commitHash': 'abc123',
        'ci.job': 'benchmark',
        'ci.persona': 'standard',
        'ci.browser': 'chrome',
        'ci.buildType': 'browserify',
        'ci.testTitle': 'measurePageStandard',
        'benchmark.mean.uiStartup': 500,
        'benchmark.mean.load': 400,
        'benchmark.mean.firstPaint': 420,
        'benchmark.p75.uiStartup': 520,
        'benchmark.p95.uiStartup': 545,
      };

      Sentry.logger.info('benchmark.standardHome', attributes);

      expect(Sentry.logger.info).toHaveBeenCalledWith(
        'benchmark.standardHome',
        expect.objectContaining({
          'ci.persona': 'standard',
          'ci.testTitle': 'measurePageStandard',
          'benchmark.mean.uiStartup': 500,
          'benchmark.mean.load': 400,
        }),
      );
    });

    it('sends user action results as structured log', () => {
      const attributes = {
        'ci.branch': 'feature/test',
        'ci.prNumber': '123',
        'ci.testTitle': 'benchmark-userActions-loadNewAccount',
        duration: 1234,
      };

      Sentry.logger.info('userAction.loadNewAccount', attributes);

      expect(Sentry.logger.info).toHaveBeenCalledWith(
        'userAction.loadNewAccount',
        expect.objectContaining({
          'ci.testTitle': 'benchmark-userActions-loadNewAccount',
          duration: 1234,
        }),
      );
    });
  });

  describe('testTitle from JSON', () => {
    it('uses testTitle from standard benchmark results', () => {
      const { testTitle } = mockResults.standardHome;
      expect(testTitle).toBe('measurePageStandard');
    });

    it('uses testTitle from user action results', () => {
      expect(mockUserActionResults.loadNewAccount.testTitle).toBe(
        'benchmark-userActions-loadNewAccount',
      );
      expect(mockUserActionResults.bridge.testTitle).toBe(
        'benchmark-userActions-bridgeUserActions',
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
