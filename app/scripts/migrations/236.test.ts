import { it as jestIt } from '@jest/globals';
import { cloneDeep } from 'lodash';
import { migrate, version } from './236';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

const createState = (appState: unknown): VersionedData => ({
  meta: { version: version - 1 },
  data: {
    AppStateController: appState,
    OtherController: { preserved: true },
  },
});

describe(`migration #${version}`, () => {
  jestIt(
    'renames the URL while preserving the pending link and unrelated state',
    async () => {
      const state = createState({
        deferredDeepLink: {
          createdAt: 1234567890,
          referringLink:
            'https://link.metamask.io/privacy?attributionId=install',
        },
        otherSetting: true,
      });
      const changedKeys = new Set<string>();

      await migrate(state, changedKeys);

      expect(state.meta.version).toBe(version);
      expect(state.data).toStrictEqual({
        AppStateController: {
          deferredDeepLink: {
            createdAt: 1234567890,
            originalUrl:
              'https://link.metamask.io/privacy?attributionId=install',
          },
          otherSetting: true,
        },
        OtherController: { preserved: true },
      });
      expect(changedKeys).toStrictEqual(new Set(['AppStateController']));

      const repeatedChanges = new Set<string>();
      await migrate(state, repeatedChanges);
      expect(repeatedChanges.size).toBe(0);
    },
  );

  jestIt(
    'preserves an existing originalUrl when both fields are present',
    async () => {
      const state = createState({
        deferredDeepLink: {
          createdAt: 1234567890,
          referringLink: 'https://link.metamask.io/old',
          originalUrl: 'https://link.metamask.io/current',
        },
      });
      const changedKeys = new Set<string>();

      await migrate(state, changedKeys);

      expect(state.data.AppStateController).toStrictEqual({
        deferredDeepLink: {
          createdAt: 1234567890,
          originalUrl: 'https://link.metamask.io/current',
        },
      });
      expect(changedKeys).toStrictEqual(new Set(['AppStateController']));
    },
  );

  jestIt('updates the version when AppStateController is absent', async () => {
    const state: VersionedData = { meta: { version: version - 1 }, data: {} };
    const changedKeys = new Set<string>();

    await migrate(state, changedKeys);

    expect(state.meta.version).toBe(version);
    expect(state.data).toStrictEqual({});
    expect(changedKeys.size).toBe(0);
  });

  jestIt.each([
    null,
    'invalid',
    {},
    { deferredDeepLink: null },
    { deferredDeepLink: 'invalid' },
    { deferredDeepLink: { createdAt: 1234567890 } },
    {
      deferredDeepLink: {
        createdAt: 1234567890,
        originalUrl: 'https://link.metamask.io/privacy',
      },
    },
  ])('leaves state without a legacy URL unchanged: %p', async (appState) => {
    const state = createState(appState);
    const before = cloneDeep(state.data);
    const changedKeys = new Set<string>();

    await migrate(state, changedKeys);

    expect(state.data).toStrictEqual(before);
    expect(changedKeys.size).toBe(0);
  });
});
