import type { MetaMaskReduxState } from '../store/store';
import {
  EXTENSION_UPDATE_PROMPT_COOLDOWN_MS,
  getExtensionUpdatePromptType,
  getShowUpdateModal,
  resolveExtensionUpdatePromptType,
} from './extension-update-prompt';

const NOW = 1_000_000_000_000;
const originalPlatform = global.platform;

type PromptStateInput = {
  currentVersion?: string | null;
  deprecatedVersion?: unknown;
  lastUpdatedAt?: number | null;
  minimumVersion?: unknown;
  pendingExtensionVersion?: string | null;
  updateModalLastDismissedAt?: number | null;
};

function buildState(input: PromptStateInput = {}): MetaMaskReduxState {
  const {
    currentVersion = '9.0.0',
    deprecatedVersion,
    lastUpdatedAt = null,
    pendingExtensionVersion = '12.0.0',
    updateModalLastDismissedAt = null,
  } = input;
  const minimumVersion = Object.prototype.hasOwnProperty.call(
    input,
    'minimumVersion',
  )
    ? input.minimumVersion
    : '10.0.0';
  global.platform = {
    getVersion: () => currentVersion as string,
  } as typeof global.platform;
  return {
    metamask: {
      lastUpdatedAt,
      pendingExtensionVersion,
      remoteFeatureFlags: {
        ...(minimumVersion !== undefined && {
          extensionUpdatePromptMinimumVersion: minimumVersion,
        }),
        ...(deprecatedVersion !== undefined && {
          extensionUpdatePromptDeprecatedVersion: deprecatedVersion,
        }),
      },
      updateModalLastDismissedAt,
    },
  } as unknown as MetaMaskReduxState;
}

describe('getExtensionUpdatePromptType', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
    global.platform = originalPlatform;
  });

  const promptCases: {
    expected: 'none' | 'versionUpdate' | 'unsupportedVersion';
    name: string;
    state: PromptStateInput;
  }[] = [
    {
      expected: 'versionUpdate',
      name: 'shows the version update when only the minimum version is set',
      state: {},
    },
    {
      expected: 'unsupportedVersion',
      name: 'shows the unsupported variant below a valid deprecated version',
      state: { currentVersion: '9.0.0', deprecatedVersion: '10.0.0' },
    },
    {
      expected: 'versionUpdate',
      name: 'shows the version update when the installed version equals the deprecated version',
      state: {
        currentVersion: '10.0.0',
        deprecatedVersion: '10.0.0',
        minimumVersion: '11.0.0',
        pendingExtensionVersion: '12.0.0',
      },
    },
    {
      expected: 'versionUpdate',
      name: 'shows the version update between the deprecated and minimum versions',
      state: {
        currentVersion: '10.5.0',
        deprecatedVersion: '10.0.0',
        minimumVersion: '11.0.0',
      },
    },
    {
      expected: 'none',
      name: 'shows nothing when the installed version equals the minimum version',
      state: { currentVersion: '10.0.0', minimumVersion: '10.0.0' },
    },
    {
      expected: 'none',
      name: 'shows nothing when the installed version is above the minimum version',
      state: { currentVersion: '11.0.0', minimumVersion: '10.0.0' },
    },
    {
      expected: 'unsupportedVersion',
      name: 'shows the unsupported variant when the thresholds are equal',
      state: {
        currentVersion: '9.0.0',
        deprecatedVersion: '10.0.0',
        minimumVersion: '10.0.0',
      },
    },
    {
      expected: 'versionUpdate',
      name: 'falls back to the version update when the deprecated version is above the minimum',
      state: { deprecatedVersion: '11.0.0', minimumVersion: '10.0.0' },
    },
    {
      expected: 'versionUpdate',
      name: 'ignores an empty deprecated version',
      state: { deprecatedVersion: '' },
    },
    {
      expected: 'versionUpdate',
      name: 'ignores a malformed deprecated version',
      state: { deprecatedVersion: 'abc' },
    },
    {
      expected: 'versionUpdate',
      name: 'ignores an object deprecated version',
      state: { deprecatedVersion: { minimumVersion: '1.0.0' } },
    },
    {
      expected: 'versionUpdate',
      name: 'ignores a numeric deprecated version',
      state: { deprecatedVersion: 10 },
    },
    {
      expected: 'none',
      name: 'shows nothing when the minimum version is missing',
      state: { deprecatedVersion: '10.0.0', minimumVersion: undefined },
    },
    {
      expected: 'none',
      name: 'shows nothing when the minimum version is malformed',
      state: { minimumVersion: 'abc' },
    },
    {
      expected: 'none',
      name: 'shows nothing when the minimum version is an object',
      state: { minimumVersion: { minimumVersion: '10.0.0' } },
    },
    {
      expected: 'none',
      name: 'shows nothing when there is no pending version',
      state: { pendingExtensionVersion: null },
    },
    {
      expected: 'none',
      name: 'shows nothing when the pending version is not newer',
      state: { currentVersion: '9.0.0', pendingExtensionVersion: '9.0.0' },
    },
    {
      expected: 'none',
      name: 'shows nothing when the installed version is unavailable',
      state: { currentVersion: null },
    },
    {
      expected: 'versionUpdate',
      name: 'compares four-segment installed versions with three-segment thresholds',
      state: {
        currentVersion: '10.2.3.111',
        minimumVersion: '10.2.3.112',
        pendingExtensionVersion: '10.2.3.113',
      },
    },
  ];

  for (const { expected, name, state } of promptCases) {
    it(name, () => {
      expect(getExtensionUpdatePromptType(buildState(state))).toBe(expected);
    });
  }

  for (const field of [
    'updateModalLastDismissedAt',
    'lastUpdatedAt',
  ] as const) {
    it(`stays hidden immediately before the 24 hour ${field} cooldown ends`, () => {
      expect(
        getExtensionUpdatePromptType(
          buildState({
            [field]: NOW - EXTENSION_UPDATE_PROMPT_COOLDOWN_MS + 1,
          }),
        ),
      ).toBe('none');
    });

    it(`stays hidden at exactly 24 hours since ${field}`, () => {
      expect(
        getExtensionUpdatePromptType(
          buildState({
            [field]: NOW - EXTENSION_UPDATE_PROMPT_COOLDOWN_MS,
          }),
        ),
      ).toBe('none');
    });

    it(`shows the prompt immediately after 24 hours since ${field}`, () => {
      expect(
        getExtensionUpdatePromptType(
          buildState({
            [field]: NOW - EXTENSION_UPDATE_PROMPT_COOLDOWN_MS - 1,
          }),
        ),
      ).toBe('versionUpdate');
    });
  }

  it('changes variant when the remote flag value changes', () => {
    const belowMinimum = buildState();
    const belowDeprecated = buildState({ deprecatedVersion: '10.0.0' });

    expect(getExtensionUpdatePromptType(belowMinimum)).toBe('versionUpdate');
    expect(getExtensionUpdatePromptType(belowDeprecated)).toBe(
      'unsupportedVersion',
    );
  });

  it('keeps getShowUpdateModal true for either visible variant', () => {
    expect(getShowUpdateModal(buildState())).toBe(true);
    expect(
      getShowUpdateModal(buildState({ deprecatedVersion: '10.0.0' })),
    ).toBe(true);
    expect(
      getShowUpdateModal(buildState({ pendingExtensionVersion: null })),
    ).toBe(false);
  });
});

describe('resolveExtensionUpdatePromptType', () => {
  const inputs = {
    installedVersion: '9.0.0',
    pendingVersion: '12.0.0',
    minimumVersion: '10.0.0',
    deprecatedVersion: undefined,
    updateModalLastDismissedAt: null,
    lastUpdatedAt: null,
    now: NOW,
  };

  it('uses the supplied time for the cooldown instead of the clock', () => {
    const dismissedAt = NOW - EXTENSION_UPDATE_PROMPT_COOLDOWN_MS;

    expect(
      resolveExtensionUpdatePromptType({
        ...inputs,
        updateModalLastDismissedAt: dismissedAt,
      }),
    ).toBe('none');
    expect(
      resolveExtensionUpdatePromptType({
        ...inputs,
        updateModalLastDismissedAt: dismissedAt,
        now: NOW + 1,
      }),
    ).toBe('versionUpdate');
  });

  it('shows nothing when the installed version is unavailable', () => {
    expect(
      resolveExtensionUpdatePromptType({
        ...inputs,
        installedVersion: undefined,
      }),
    ).toBe('none');
  });
});
