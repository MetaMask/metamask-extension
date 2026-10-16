import { it as jestIt } from '@jest/globals';
import {
  buildNetworkPolicyRules,
  createBlockedNetworkPolicyRules,
  isNetworkRequestAllowed,
  NETWORK_POLICY_RULE_ID,
  NETWORK_POLICY_RULE_LIMIT,
  normalizeNetworkPolicy,
  type NetworkPolicy,
} from './network-policy';

const EXTENSION_ID = 'a'.repeat(32);

describe('normalizeNetworkPolicy', () => {
  it('copies and freezes policy inputs', () => {
    const policy: NetworkPolicy = {
      mode: 'allowlist',
      allowedDomains: ['EXAMPLE.com.', 'example.com'],
      allowedRpcUrls: ['https://user:secret@rpc.test:443/path#fragment'],
    };

    const normalized = normalizeNetworkPolicy(policy);

    expect(normalized).toStrictEqual({
      mode: 'allowlist',
      allowedDomains: ['example.com'],
      allowedRpcUrls: ['https://rpc.test/path'],
    });
    expect(Object.isFrozen(normalized)).toBe(true);
    expect(Object.isFrozen(normalized.allowedDomains)).toBe(true);
    expect(Object.isFrozen(normalized.allowedRpcUrls)).toBe(true);
    expect(normalized.allowedDomains).not.toBe(policy.allowedDomains);
  });

  it('keeps normalization independent of later URL prototype mutations', () => {
    const original = Object.getOwnPropertyDescriptor(URL.prototype, 'toString');
    Object.defineProperty(URL.prototype, 'toString', {
      configurable: true,
      value: () => 'https://attacker.test/',
    });
    try {
      expect(
        normalizeNetworkPolicy({
          mode: 'allowlist',
          allowedDomains: ['rpc.test'],
          allowedRpcUrls: ['https://rpc.test/key'],
        }),
      ).toStrictEqual({
        mode: 'allowlist',
        allowedDomains: ['rpc.test'],
        allowedRpcUrls: ['https://rpc.test/key'],
      });
    } finally {
      if (original) {
        Object.defineProperty(URL.prototype, 'toString', original);
      }
    }
  });

  it('does not let a poisoned hostname getter expand a saved-domain grant', () => {
    const original = Object.getOwnPropertyDescriptor(URL.prototype, 'hostname');
    Object.defineProperty(URL.prototype, 'hostname', {
      configurable: true,
      get: () => 'attacker.test',
    });
    try {
      expect(
        normalizeNetworkPolicy({
          mode: 'allowlist',
          allowedDomains: ['saved-rpc.test'],
          allowedRpcUrls: ['https://saved-rpc.test/key'],
        }),
      ).toStrictEqual({
        mode: 'allowlist',
        allowedDomains: ['saved-rpc.test'],
        allowedRpcUrls: ['https://saved-rpc.test/key'],
      });
    } finally {
      if (original) {
        Object.defineProperty(URL.prototype, 'hostname', original);
      }
    }
  });

  it('does not invoke an attacker-owned call property on the URL stringifier', () => {
    const stringifier = URL.prototype.toString;
    const original = Object.getOwnPropertyDescriptor(stringifier, 'call');
    Object.defineProperty(stringifier, 'call', {
      configurable: true,
      value: () => 'https://attacker.test/',
    });
    try {
      expect(
        normalizeNetworkPolicy({
          mode: 'allowlist',
          allowedDomains: ['saved-rpc.test'],
          allowedRpcUrls: ['https://saved-rpc.test/key'],
        }),
      ).toStrictEqual({
        mode: 'allowlist',
        allowedDomains: ['saved-rpc.test'],
        allowedRpcUrls: ['https://saved-rpc.test/key'],
      });
    } finally {
      if (original) {
        Object.defineProperty(stringifier, 'call', original);
      } else {
        Reflect.deleteProperty(stringifier, 'call');
      }
    }
  });

  jestIt.each([
    'https://example.com',
    'example.com:443',
    '*.example.com',
    'host/path',
    '',
  ])('rejects a non-hostname domain: %s', (domain) => {
    expect(() =>
      normalizeNetworkPolicy({
        mode: 'allowlist',
        allowedDomains: [domain],
        allowedRpcUrls: [],
      }),
    ).toThrow('bare hostnames');
  });

  jestIt.each(['data:text/plain,hello', 'wss://rpc.test', '/relative'])(
    'rejects a non-HTTP RPC endpoint: %s',
    (url) => {
      expect(() =>
        normalizeNetworkPolicy({
          mode: 'allowlist',
          allowedDomains: [],
          allowedRpcUrls: [url],
        }),
      ).toThrow(/HTTP\(S\)|Invalid URL/u);
    },
  );
});

describe('isNetworkRequestAllowed', () => {
  jestIt.each([
    'http://rpc.test/',
    'https://rpc.test/',
    'ws://rpc.test/',
    'wss://rpc.test/',
  ])('blocks remote requests before initialization: %s', (url) => {
    expect(
      isNetworkRequestAllowed(
        { mode: 'blocked', allowedDomains: [], allowedRpcUrls: [] },
        url,
      ),
    ).toBe(false);
  });

  it('keeps packaged and non-network assets accessible', () => {
    const policy: NetworkPolicy = {
      mode: 'blocked',
      allowedDomains: [],
      allowedRpcUrls: [],
    };

    expect(
      isNetworkRequestAllowed(
        policy,
        `chrome-extension://${EXTENSION_ID}/asset.json`,
      ),
    ).toBe(true);
    expect(isNetworkRequestAllowed(policy, 'data:text/plain,hello')).toBe(true);
  });

  it('permits only an exact saved RPC URL', () => {
    const policy = normalizeNetworkPolicy({
      mode: 'allowlist',
      allowedDomains: [],
      allowedRpcUrls: ['https://rpc.test/key?api=secret'],
    });

    expect(
      isNetworkRequestAllowed(policy, 'https://rpc.test/key?api=secret'),
    ).toBe(true);
    expect(
      isNetworkRequestAllowed(policy, 'https://rpc.test/key?api=another'),
    ).toBe(false);
    expect(isNetworkRequestAllowed(policy, 'https://rpc.test/other')).toBe(
      false,
    );
    expect(
      isNetworkRequestAllowed(policy, 'https://rpc.test.evil/key?api=secret'),
    ).toBe(false);
  });

  it('permits an exact hostname on every port', () => {
    const policy = normalizeNetworkPolicy({
      mode: 'allowlist',
      allowedDomains: ['example.com'],
      allowedRpcUrls: [],
    });

    expect(isNetworkRequestAllowed(policy, 'https://example.com:444/a')).toBe(
      true,
    );
    expect(isNetworkRequestAllowed(policy, 'wss://example.com/a')).toBe(true);
    expect(isNetworkRequestAllowed(policy, 'https://example.com./a')).toBe(
      true,
    );
    expect(isNetworkRequestAllowed(policy, 'https://sub.example.com/a')).toBe(
      false,
    );
    expect(isNetworkRequestAllowed(policy, 'https://example.com.evil/a')).toBe(
      false,
    );
  });

  it('permits arbitrary remote destinations for wildcard policy', () => {
    expect(
      isNetworkRequestAllowed(
        { mode: 'allow-all', allowedDomains: [], allowedRpcUrls: [] },
        'https://anywhere.test/',
      ),
    ).toBe(true);
  });
});

describe('createBlockedNetworkPolicyRules', () => {
  it('scopes the startup deny to this extension for every resource type', () => {
    const [rule, topRule] = createBlockedNetworkPolicyRules(EXTENSION_ID);

    expect(rule.id).toBe(NETWORK_POLICY_RULE_ID);
    expect(rule.action.type).toBe('block');
    expect(rule.condition.initiatorDomains).toStrictEqual([EXTENSION_ID]);
    expect(topRule.condition.topDomains).toStrictEqual([EXTENSION_ID]);
    expect(topRule.condition.initiatorDomains).toBeUndefined();
    expect(rule.condition.resourceTypes).toStrictEqual(
      expect.arrayContaining([
        'main_frame',
        'sub_frame',
        'xmlhttprequest',
        'websocket',
        'image',
        'ping',
        'other',
      ]),
    );
  });

  jestIt.each(['', 'example.com', 'a'.repeat(31), 'z'.repeat(32)])(
    'rejects an invalid extension identity: %s',
    (id) => {
      expect(() => createBlockedNetworkPolicyRules(id)).toThrow(
        'valid Chrome extension ID',
      );
    },
  );
});

describe('buildNetworkPolicyRules', () => {
  it('anchors exact RPC URLs without interpreting regex metacharacters', () => {
    const [rule] = buildNetworkPolicyRules(
      {
        mode: 'allowlist',
        allowedDomains: [],
        allowedRpcUrls: ['https://rpc.test/a.*?key=hello|world'],
      },
      EXTENSION_ID,
    ).filter(({ action }) => action.type === 'allow');
    const pattern = new RegExp(rule.condition.regexFilter as string, 'u');

    expect(pattern.test('https://rpc.test/a.*?key=hello|world')).toBe(true);
    expect(pattern.test('https://rpc.test/abc?key=hello')).toBe(false);
    expect(pattern.test('https://rpc.test/a.*?key=hello|world/extra')).toBe(
      false,
    );
    expect(rule.condition.isUrlFilterCaseSensitive).toBe(true);
    expect(rule.condition.initiatorDomains).toStrictEqual([EXTENSION_ID]);
    expect(rule.priority).toBeGreaterThan(1);
  });

  it('anchors domain grants without allowing subdomains', () => {
    const [rule] = buildNetworkPolicyRules(
      {
        mode: 'allowlist',
        allowedDomains: ['example.com'],
        allowedRpcUrls: [],
      },
      EXTENSION_ID,
    ).filter(({ action }) => action.type === 'allow');
    const pattern = new RegExp(rule.condition.regexFilter as string, 'u');

    expect(pattern.test('https://example.com:444/a')).toBe(true);
    expect(pattern.test('wss://example.com./a')).toBe(true);
    expect(pattern.test('https://sub.example.com/a')).toBe(false);
    expect(pattern.test('https://example.com.evil/a')).toBe(false);
    expect(pattern.test('https://example.com@evil.test/a')).toBe(false);
  });

  it('rejects policies that exceed the reserved browser rule budget', () => {
    expect(() =>
      buildNetworkPolicyRules(
        {
          mode: 'allowlist',
          allowedDomains: Array.from(
            { length: NETWORK_POLICY_RULE_LIMIT },
            (_, index) => `${index}.test`,
          ),
          allowedRpcUrls: [],
        },
        EXTENSION_ID,
      ),
    ).toThrow('rule limit');
  });
});
