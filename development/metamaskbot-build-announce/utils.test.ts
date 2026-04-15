import {
  buildSectionWithFallback,
  postCommentWithMetamaskBot,
  buildCombo,
  buildEntryKey,
  buildArtifactFilename,
  buildArtifactUrl,
  resolveBaseline,
  extractPresetFromArtifactName,
  resolveBaselineFromArtifactName,
} from './utils';
import type { HistoricalBaselineReference } from './historical-comparison';

describe('buildSectionWithFallback', () => {
  it('returns the builder result when it resolves with a string', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve('<p>ok</p>'),
      'Test section',
    );

    expect(result).toBe('<p>ok</p>');
  });

  it('returns fallback when builder resolves null', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve(null),
      'Test section',
    );

    expect(result).toBe('<p><i>Test section: data not available.</i></p>\n\n');
  });

  it('returns fallback when builder resolves with undefined', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve(undefined),
      'Test section',
    );

    expect(result).toBe('<p><i>Test section: data not available.</i></p>\n\n');
  });

  it('returns fallback when builder resolves with no data returned', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve(''),
      'Test section',
    );

    expect(result).toBe('<p><i>Test section: data not available.</i></p>\n\n');
  });

  it('returns fallback and logs the error when builder throws', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await buildSectionWithFallback(
      () => Promise.reject(new Error('boom')),
      'Broken section',
    );

    expect(result).toBe(
      '<p><i>Broken section: data not available.</i></p>\n\n',
    );
    expect(logSpy).toHaveBeenCalledWith(
      'No data available for Broken section; skipping (Error: boom)',
    );

    logSpy.mockRestore();
  });
});

describe('postCommentWithMetamaskBot', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockFetch.mockReset();
  });

  const baseParams = {
    commentBody: '<p>hello</p>',
    owner: 'MetaMask',
    repository: 'metamask-extension',
    prNumber: '42',
    commentToken: 'secret-token',
  };

  it('returns null when commentToken is not provided', async () => {
    const result = await postCommentWithMetamaskBot({
      ...baseParams,
      commentToken: undefined,
    });

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('logs optionalLog when provided', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    mockFetch.mockResolvedValue({ ok: true } as Response);

    await postCommentWithMetamaskBot({
      ...baseParams,
      optionalLog: 'debug info',
    });

    expect(logSpy).toHaveBeenCalledWith('debug info');
  });

  it('posts to the correct GitHub issues API URL', async () => {
    mockFetch.mockResolvedValue({ ok: true } as Response);

    await postCommentWithMetamaskBot(baseParams);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/MetaMask/metamask-extension/issues/42/comments',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'token secret-token',
          'User-Agent': 'metamaskbot',
        }),
      }),
    );
  });

  it('returns the response on success', async () => {
    const mockResponse = { ok: true } as Response;
    mockFetch.mockResolvedValue(mockResponse);

    const result = await postCommentWithMetamaskBot(baseParams);

    expect(result).toBe(mockResponse);
  });

  it('throws when the response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      text: () => Promise.resolve('not allowed'),
    } as unknown as Response);

    await expect(postCommentWithMetamaskBot(baseParams)).rejects.toThrow(
      "Post comment failed with status 'Forbidden': not allowed",
    );
  });
});

describe('artifact utilities', () => {
  it('builds combo, entry key, filename and URL', () => {
    expect(buildCombo('chrome', 'browserify')).toBe('chrome-browserify');
    expect(buildEntryKey('loadNewAccount', 'chrome', 'browserify')).toBe(
      'loadNewAccount|chrome-browserify',
    );
    expect(
      buildArtifactFilename('chrome', 'browserify', 'interactionUserActions'),
    ).toBe('benchmark-chrome-browserify-interactionUserActions.json');
    expect(
      buildArtifactUrl(
        'https://ci.example.com',
        'chrome',
        'browserify',
        'interactionUserActions',
      ),
    ).toBe(
      'https://ci.example.com/benchmarks/benchmark-chrome-browserify-interactionUserActions.json',
    );
  });
});

describe('extractPresetFromArtifactName', () => {
  it('extracts preset from artifact names', () => {
    expect(
      extractPresetFromArtifactName(
        'benchmark-chrome-browserify-interactionUserActions',
      ),
    ).toBe('interactionUserActions');
    expect(
      extractPresetFromArtifactName(
        'benchmark-chrome-browserify-userJourneyOnboardingImport',
      ),
    ).toBe('userJourneyOnboardingImport');
  });

  it('maps startup presets to pageLoad', () => {
    expect(
      extractPresetFromArtifactName(
        'benchmark-chrome-browserify-startupStandardHome',
      ),
    ).toBe('pageLoad');
  });

  it('returns undefined for invalid artifact names', () => {
    expect(extractPresetFromArtifactName('invalid-name')).toBeUndefined();
  });
});

/* eslint-disable @typescript-eslint/naming-convention -- benchmark metric IDs use snake_case (match emitted timer IDs) */
describe('resolveBaseline', () => {
  const mockBaseline: HistoricalBaselineReference = {
    'interactionUserActions/loadNewAccount': {
      load_new_account: { mean: 500, stdDev: 30, p75: 540, p95: 600 },
    },
    'userJourneyOnboardingImport/onboardingImportWallet': {
      importWalletToSocialScreen: {
        mean: 1100,
        stdDev: 50,
        p75: 1400,
        p95: 1900,
      },
    },
    'pageLoad/chrome-browserify-startupStandardHome': {
      uiStartup: { mean: 1400, stdDev: 80, p75: 1700, p95: 2100 },
    },
    'pageLoad/firefox-webpack-startupPowerUserHome': {
      uiStartup: { mean: 3000, stdDev: 200, p75: 3500, p95: 5000 },
    },
  };

  it('resolves interaction and user journey baselines', () => {
    expect(
      resolveBaseline(mockBaseline, 'interactionUserActions', 'loadNewAccount')
        ?.load_new_account.mean,
    ).toBe(500);
    expect(
      resolveBaseline(
        mockBaseline,
        'userJourneyOnboardingImport',
        'onboardingImportWallet',
      )?.importWalletToSocialScreen.mean,
    ).toBe(1100);
  });

  it('maps startup preset to pageLoad and resolves platform-specific baseline', () => {
    expect(
      resolveBaseline(
        mockBaseline,
        'startupStandardHome',
        'chrome-browserify-startupStandardHome',
      )?.uiStartup.mean,
    ).toBe(1400);
    expect(
      resolveBaseline(
        mockBaseline,
        'startupPowerUserHome',
        'firefox-webpack-startupPowerUserHome',
      )?.uiStartup.mean,
    ).toBe(3000);
  });

  it('returns undefined for missing benchmarks', () => {
    expect(
      resolveBaseline(mockBaseline, 'interactionUserActions', 'unknown'),
    ).toBeUndefined();
    expect(
      resolveBaseline(
        mockBaseline,
        'startupStandardHome',
        'firefox-browserify-startupStandardHome',
      ),
    ).toBeUndefined();
  });
});

describe('resolveBaselineFromArtifactName', () => {
  const mockBaseline: HistoricalBaselineReference = {
    'interactionUserActions/loadNewAccount': {
      load_new_account: { mean: 500, p75: 540, p95: 600 },
    },
    'pageLoad/chrome-browserify-startupStandardHome': {
      uiStartup: { mean: 1400, p75: 1700, p95: 2100 },
    },
    'userJourneyOnboardingImport/onboardingImportWallet': {
      importWalletToSocialScreen: { mean: 1100, p75: 1400, p95: 1900 },
    },
  };

  it('extracts preset and resolves baseline for all benchmark types', () => {
    expect(
      resolveBaselineFromArtifactName(
        mockBaseline,
        'loadNewAccount',
        'benchmark-chrome-browserify-interactionUserActions',
      )?.load_new_account.mean,
    ).toBe(500);
    expect(
      resolveBaselineFromArtifactName(
        mockBaseline,
        'onboardingImportWallet',
        'benchmark-chrome-browserify-userJourneyOnboardingImport',
      )?.importWalletToSocialScreen.mean,
    ).toBe(1100);
    expect(
      resolveBaselineFromArtifactName(
        mockBaseline,
        'chrome-browserify-startupStandardHome',
        'benchmark-chrome-browserify-startupStandardHome',
      )?.uiStartup.mean,
    ).toBe(1400);
  });

  it('returns undefined for invalid inputs', () => {
    expect(
      resolveBaselineFromArtifactName(
        mockBaseline,
        'loadNewAccount',
        'invalid',
      ),
    ).toBeUndefined();
    expect(
      resolveBaselineFromArtifactName(
        mockBaseline,
        'unknown',
        'benchmark-chrome-browserify-unknownPreset',
      ),
    ).toBeUndefined();
  });
});

describe('multi-platform scenarios', () => {
  it('handles interaction on all 4 platform combos with shared baseline', () => {
    const baseline: HistoricalBaselineReference = {
      'interactionUserActions/loadNewAccount': {
        load_new_account: { mean: 500, p75: 540, p95: 600 },
      },
    };

    const chromeBrowserify = resolveBaselineFromArtifactName(
      baseline,
      'loadNewAccount',
      'benchmark-chrome-browserify-interactionUserActions',
    );
    const chromeWebpack = resolveBaselineFromArtifactName(
      baseline,
      'loadNewAccount',
      'benchmark-chrome-webpack-interactionUserActions',
    );
    const firefoxBrowserify = resolveBaselineFromArtifactName(
      baseline,
      'loadNewAccount',
      'benchmark-firefox-browserify-interactionUserActions',
    );
    const firefoxWebpack = resolveBaselineFromArtifactName(
      baseline,
      'loadNewAccount',
      'benchmark-firefox-webpack-interactionUserActions',
    );

    expect(chromeBrowserify).toBeDefined();
    expect(chromeWebpack).toStrictEqual(chromeBrowserify);
    expect(firefoxBrowserify).toStrictEqual(chromeBrowserify);
    expect(firefoxWebpack).toStrictEqual(chromeBrowserify);
  });

  it('handles user journey with chrome-browserify and chrome-webpack sharing baseline', () => {
    const baseline: HistoricalBaselineReference = {
      'userJourneyOnboardingImport/onboardingImportWallet': {
        importWalletToSocialScreen: { mean: 1100, p75: 1400, p95: 1900 },
      },
    };

    const chromeBrowserify = resolveBaselineFromArtifactName(
      baseline,
      'onboardingImportWallet',
      'benchmark-chrome-browserify-userJourneyOnboardingImport',
    );
    const chromeWebpack = resolveBaselineFromArtifactName(
      baseline,
      'onboardingImportWallet',
      'benchmark-chrome-webpack-userJourneyOnboardingImport',
    );

    expect(chromeBrowserify).toBeDefined();
    expect(chromeWebpack).toStrictEqual(chromeBrowserify);
  });

  it('handles startup with platform-specific baselines for each of 4 combos', () => {
    const baseline: HistoricalBaselineReference = {
      'pageLoad/chrome-browserify-startupStandardHome': {
        uiStartup: { mean: 1400, p75: 1700, p95: 2100 },
      },
      'pageLoad/chrome-webpack-startupStandardHome': {
        uiStartup: { mean: 1450, p75: 1750, p95: 2150 },
      },
      'pageLoad/firefox-browserify-startupStandardHome': {
        uiStartup: { mean: 1600, p75: 1900, p95: 2400 },
      },
      'pageLoad/firefox-webpack-startupStandardHome': {
        uiStartup: { mean: 1650, p75: 1950, p95: 2450 },
      },
    };

    const chromeBrowserify = resolveBaseline(
      baseline,
      'startupStandardHome',
      'chrome-browserify-startupStandardHome',
    );
    const chromeWebpack = resolveBaseline(
      baseline,
      'startupStandardHome',
      'chrome-webpack-startupStandardHome',
    );
    const firefoxBrowserify = resolveBaseline(
      baseline,
      'startupStandardHome',
      'firefox-browserify-startupStandardHome',
    );
    const firefoxWebpack = resolveBaseline(
      baseline,
      'startupStandardHome',
      'firefox-webpack-startupStandardHome',
    );

    expect(chromeBrowserify?.uiStartup.mean).toBe(1400);
    expect(chromeWebpack?.uiStartup.mean).toBe(1450);
    expect(firefoxBrowserify?.uiStartup.mean).toBe(1600);
    expect(firefoxWebpack?.uiStartup.mean).toBe(1650);
  });
});
/* eslint-enable @typescript-eslint/naming-convention */
