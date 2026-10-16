import { it } from '@jest/globals';
import { migrate, version } from './234';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

describe(`migration #${version}`, () => {
  it('initializes the missing controller and updates the version', async () => {
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: { OtherController: { preserved: true } },
    };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(state.meta.version).toBe(version);
    expect(state.data).toStrictEqual({
      NetworkPolicyController: { postOnboardingNetworkDomains: '*' },
      OtherController: { preserved: true },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['NetworkPolicyController']),
    );
  });

  it('initializes a missing policy without replacing other controller fields', async () => {
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: { NetworkPolicyController: { preserved: true } },
    };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(state.data.NetworkPolicyController).toStrictEqual({
      postOnboardingNetworkDomains: '*',
      preserved: true,
    });
    expect(changedControllers).toStrictEqual(
      new Set(['NetworkPolicyController']),
    );
  });

  it.each([
    { label: 'wildcard', policy: '*' },
    { label: 'exact hostnames', policy: ['private.example'] },
    { label: 'empty allowlist', policy: [] },
    { label: 'malformed authorization', policy: 'invalid' },
    { label: 'null authorization', policy: null },
  ])('preserves existing $label', async ({ policy }) => {
    const controller = { postOnboardingNetworkDomains: policy };
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: { NetworkPolicyController: controller },
    };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(state.data.NetworkPolicyController).toStrictEqual({
      postOnboardingNetworkDomains: policy,
    });
    expect(changedControllers.size).toBe(0);
  });

  it('preserves malformed controller state for runtime validation', async () => {
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: { NetworkPolicyController: null },
    };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(state.data.NetworkPolicyController).toBeNull();
    expect(changedControllers.size).toBe(0);
  });
});
