import {
  buildNetworkPolicyRules,
  NETWORK_POLICY_RULE_ID,
  type NetworkPolicy,
} from '../../../shared/lib/network-policy';
import {
  createNetworkPolicyEnforcement,
  type NetworkPolicyDnr,
} from './network-policy-enforcement';

const EXTENSION_ID = 'a'.repeat(32);

function mockDnr(initialRules: chrome.declarativeNetRequest.Rule[] = []) {
  let sessionRules = initialRules;
  const apply = (
    current: chrome.declarativeNetRequest.Rule[],
    options: chrome.declarativeNetRequest.UpdateRuleOptions,
  ) => [
    ...current.filter(({ id }) => !options.removeRuleIds?.includes(id)),
    ...(options.addRules ?? []),
  ];
  const api = {
    isRegexSupported: jest.fn(async () => ({ isSupported: true })),
    getSessionRules: jest.fn(async () => sessionRules),
    updateSessionRules: jest.fn(async (options) => {
      sessionRules = apply(sessionRules, options);
    }),
  } satisfies NetworkPolicyDnr;
  return {
    api,
    getRules: () => sessionRules,
    getSessionRules: () => sessionRules,
  };
}

const blocked: NetworkPolicy = {
  mode: 'blocked',
  allowedDomains: [],
  allowedRpcUrls: [],
};

const allowAll: NetworkPolicy = {
  mode: 'allow-all',
  allowedDomains: [],
  allowedRpcUrls: [],
};

describe('createNetworkPolicyEnforcement', () => {
  describe('Chrome DNR', () => {
    it('atomically replaces only its own session rules', async () => {
      const unrelated: chrome.declarativeNetRequest.Rule = {
        id: 7,
        action: { type: 'block' },
        condition: { urlFilter: 'unrelated.test' },
      };
      const dnr = mockDnr([
        unrelated,
        ...buildNetworkPolicyRules(allowAll, EXTENSION_ID),
      ]);
      const enforcement = createNetworkPolicyEnforcement({
        extensionId: EXTENSION_ID,
        declarativeNetRequest: dnr.api,
      });

      await enforcement.update({
        mode: 'allowlist',
        allowedDomains: [],
        allowedRpcUrls: ['https://rpc.test/key'],
      });

      expect(dnr.api.updateSessionRules).toHaveBeenCalledTimes(1);
      expect(dnr.api.updateSessionRules).toHaveBeenCalledWith({
        removeRuleIds: [
          NETWORK_POLICY_RULE_ID,
          NETWORK_POLICY_RULE_ID + 1,
          NETWORK_POLICY_RULE_ID + 2,
          NETWORK_POLICY_RULE_ID + 3,
        ],
        addRules: buildNetworkPolicyRules(
          {
            mode: 'allowlist',
            allowedDomains: [],
            allowedRpcUrls: ['https://rpc.test/key'],
          },
          EXTENSION_ID,
        ).filter(({ action }) => action.type === 'allow'),
      });
      expect(dnr.getRules()).toContain(unrelated);
    });

    it('serializes updates in call order', async () => {
      const dnr = mockDnr();
      let release: () => void = () => undefined;
      let started: () => void = () => undefined;
      const firstStarted = new Promise<void>((resolve) => {
        started = resolve;
      });
      const firstReleased = new Promise<void>((resolve) => {
        release = resolve;
      });
      dnr.api.updateSessionRules.mockImplementationOnce(async () => {
        started();
        await firstReleased;
      });
      const enforcement = createNetworkPolicyEnforcement({
        extensionId: EXTENSION_ID,
        declarativeNetRequest: dnr.api,
      });
      const first = enforcement.update(allowAll);
      await firstStarted;

      const second = enforcement.update(blocked);

      expect(dnr.api.updateSessionRules).toHaveBeenCalledTimes(1);
      release();
      await Promise.all([first, second]);
      expect(dnr.getRules().some(({ action }) => action.type === 'allow')).toBe(
        false,
      );
    });

    it('removes old allows when an update fails', async () => {
      const dnr = mockDnr(buildNetworkPolicyRules(allowAll, EXTENSION_ID));
      dnr.api.updateSessionRules.mockRejectedValueOnce(new Error('quota'));
      const enforcement = createNetworkPolicyEnforcement({
        extensionId: EXTENSION_ID,
        declarativeNetRequest: dnr.api,
      });

      await expect(
        enforcement.update({
          mode: 'allowlist',
          allowedDomains: ['rpc.test'],
          allowedRpcUrls: [],
        }),
      ).rejects.toThrow('quota');

      expect(dnr.getRules().some(({ action }) => action.type === 'allow')).toBe(
        false,
      );
      await expect(enforcement.update(allowAll)).resolves.toBeUndefined();
      expect(dnr.getRules().some(({ action }) => action.type === 'allow')).toBe(
        true,
      );
    });

    it('fails closed for unsupported regexes', async () => {
      const dnr = mockDnr(buildNetworkPolicyRules(allowAll, EXTENSION_ID));
      dnr.api.isRegexSupported.mockResolvedValue({ isSupported: false });
      const enforcement = createNetworkPolicyEnforcement({
        extensionId: EXTENSION_ID,
        declarativeNetRequest: dnr.api,
      });

      await expect(enforcement.update(allowAll)).rejects.toThrow(
        'regex limits',
      );

      expect(dnr.getRules().some(({ action }) => action.type === 'allow')).toBe(
        false,
      );
    });

    it('isolates endpoint validation to its dedicated tab', async () => {
      const dnr = mockDnr();
      const enforcement = createNetworkPolicyEnforcement({
        extensionId: EXTENSION_ID,
        declarativeNetRequest: dnr.api,
      });
      await enforcement.update({ ...blocked, mode: 'allowlist' });

      const revoke = await enforcement.allowRpcValidation({
        tabId: 8,
        url: 'https://rpc.test/key',
      });

      const [rule] = dnr.getSessionRules();
      expect(rule.condition).toMatchObject({
        regexFilter: '^https://rpc\\.test/key$',
        initiatorDomains: [EXTENSION_ID],
        tabIds: [8],
        requestMethods: ['post', 'options'],
        resourceTypes: ['xmlhttprequest'],
      });
      await revoke();
      await revoke();
      expect(dnr.getSessionRules()).toStrictEqual([]);
    });

    it('revokes an outstanding validation grant when onboarding resets', async () => {
      const dnr = mockDnr();
      const enforcement = createNetworkPolicyEnforcement({
        extensionId: EXTENSION_ID,
        declarativeNetRequest: dnr.api,
      });
      await enforcement.update(allowAll);
      await enforcement.allowRpcValidation({
        tabId: 8,
        url: 'https://rpc.test/',
      });

      await enforcement.update(blocked);

      expect(dnr.getSessionRules()).toStrictEqual([]);
    });

    it('does not let stale cleanup revoke a replacement broker grant', async () => {
      const dnr = mockDnr();
      const enforcement = createNetworkPolicyEnforcement({
        extensionId: EXTENSION_ID,
        declarativeNetRequest: dnr.api,
      });
      await enforcement.update({ ...blocked, mode: 'allowlist' });
      const revokeOld = await enforcement.allowRpcValidation({
        tabId: 8,
        url: 'https://old-rpc.test/',
      });
      await enforcement.update(blocked);
      await enforcement.update({ ...blocked, mode: 'allowlist' });
      const revokeNew = await enforcement.allowRpcValidation({
        tabId: 9,
        url: 'https://new-rpc.test/',
      });

      await revokeOld();

      expect(dnr.getSessionRules()).toHaveLength(2);
      expect(dnr.getSessionRules()[0].condition.tabIds).toStrictEqual([9]);
      await revokeNew();
      expect(dnr.getSessionRules()).toStrictEqual([]);
    });
  });
});
