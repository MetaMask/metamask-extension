import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  METAMASK_BETA_CHROME_ID,
  METAMASK_FLASK_CHROME_ID,
  METAMASK_PROD_CHROME_ID,
} from '../../../../../shared/constants/app';
import { createBlockedNetworkPolicyRules } from '../../../../../shared/lib/network-policy';
import {
  CHROME_MANIFEST_KEY_NON_PRODUCTION,
  CHROME_MANIFEST_KEY_RELEASE_CANDIDATE,
} from '../../constants';
import {
  createPackagedNetworkPolicyRules,
  NETWORK_POLICY_RULESET_ID,
  NETWORK_POLICY_RULES_PATH,
} from './network-policy';

function createManifest(key?: string): chrome.runtime.Manifest {
  return {
    name: 'Network policy test',
    version: '1.0',
    manifest_version: 3,
    minimum_chrome_version: '145',
    key,
    permissions: ['declarativeNetRequestWithHostAccess'],
    declarative_net_request: {
      rule_resources: [
        {
          id: NETWORK_POLICY_RULESET_ID,
          enabled: true,
          path: NETWORK_POLICY_RULES_PATH,
        },
      ],
    },
  };
}

describe('createPackagedNetworkPolicyRules', () => {
  it('scopes development rules to the ID derived from the effective public key', () => {
    const rules = createPackagedNetworkPolicyRules(
      createManifest(CHROME_MANIFEST_KEY_NON_PRODUCTION),
      'main',
    );

    assert.deepEqual(
      rules,
      createBlockedNetworkPolicyRules('hebhblbkkdabgoldnojllkipeoacjioc'),
    );
  });

  it('uses a manifest key override before the published distribution ID', () => {
    const rules = createPackagedNetworkPolicyRules(
      createManifest(CHROME_MANIFEST_KEY_RELEASE_CANDIDATE),
      'flask',
    );

    assert.deepEqual(
      rules,
      createBlockedNetworkPolicyRules(METAMASK_PROD_CHROME_ID),
    );
  });

  for (const [buildType, extensionId] of [
    ['main', METAMASK_PROD_CHROME_ID],
    ['beta', METAMASK_BETA_CHROME_ID],
    ['flask', METAMASK_FLASK_CHROME_ID],
  ]) {
    it(`scopes keyless ${buildType} rules to the published extension`, () => {
      const rules = createPackagedNetworkPolicyRules(
        createManifest(),
        buildType,
      );

      assert.deepEqual(rules, createBlockedNetworkPolicyRules(extensionId));
    });
  }

  it('rejects keyless builds without a known extension ID', () => {
    assert.throws(
      () => createPackagedNetworkPolicyRules(createManifest(), 'unknown'),
      /No Chrome extension ID/u,
    );
  });

  it('scopes a keyless store package to its explicit signing ID', () => {
    const extensionId = 'abcdefghijklmnopabcdefghijklmnop';

    const rules = createPackagedNetworkPolicyRules(
      createManifest(),
      'unknown',
      false,
      extensionId,
    );

    assert.deepEqual(rules, createBlockedNetworkPolicyRules(extensionId));
  });

  it('uses the explicit store signing ID instead of the Chrome Web Store default', () => {
    const extensionId = 'abcdefghijklmnopabcdefghijklmnop';

    const rules = createPackagedNetworkPolicyRules(
      createManifest(),
      'main',
      false,
      extensionId,
    );

    assert.deepEqual(rules, createBlockedNetworkPolicyRules(extensionId));
  });

  it('accepts an explicit signing ID that matches the manifest public key', () => {
    const rules = createPackagedNetworkPolicyRules(
      createManifest(CHROME_MANIFEST_KEY_NON_PRODUCTION),
      'main',
      false,
      'hebhblbkkdabgoldnojllkipeoacjioc',
    );

    assert.deepEqual(
      rules,
      createBlockedNetworkPolicyRules('hebhblbkkdabgoldnojllkipeoacjioc'),
    );
  });

  it('rejects an explicit signing ID that conflicts with the manifest public key', () => {
    assert.throws(
      () =>
        createPackagedNetworkPolicyRules(
          createManifest(CHROME_MANIFEST_KEY_NON_PRODUCTION),
          'main',
          false,
          METAMASK_PROD_CHROME_ID,
        ),
      /conflicts with the manifest public key/u,
    );
  });

  for (const extensionId of [
    '',
    'a'.repeat(31),
    'a'.repeat(33),
    'q'.repeat(32),
    'A'.repeat(32),
    `${'a'.repeat(32)}\n`,
    `${METAMASK_PROD_CHROME_ID},${METAMASK_BETA_CHROME_ID}`,
  ]) {
    it(`rejects the invalid target signing ID ${JSON.stringify(extensionId)}`, () => {
      assert.throws(
        () =>
          createPackagedNetworkPolicyRules(
            createManifest(),
            'main',
            false,
            extensionId,
          ),
        /exactly 32 lowercase letters from a to p/u,
      );
    });
  }

  it('rejects malformed manifest key overrides', () => {
    assert.throws(() =>
      createPackagedNetworkPolicyRules(createManifest('malformed key'), 'main'),
    );
  });

  it('rejects disabled startup enforcement', () => {
    const manifest = createManifest();
    const ruleset = manifest.declarative_net_request?.rule_resources?.[0];
    assert.ok(ruleset);
    ruleset.enabled = false;

    assert.throws(
      () => createPackagedNetworkPolicyRules(manifest, 'main'),
      /must be enabled/u,
    );
  });

  it('rejects an unexpected packaged rules path', () => {
    const manifest = createManifest();
    const ruleset = manifest.declarative_net_request?.rule_resources?.[0];
    assert.ok(ruleset);
    ruleset.path = 'other.json';

    assert.throws(
      () => createPackagedNetworkPolicyRules(manifest, 'main'),
      /must be enabled/u,
    );
  });

  it('rejects manifests without the warning-free host access permission', () => {
    const manifest = createManifest();
    manifest.permissions = [];

    assert.throws(
      () => createPackagedNetworkPolicyRules(manifest, 'main'),
      /must be enabled/u,
    );
  });

  it('rejects a minimum Chrome version without topDomains support', () => {
    const manifest = createManifest();
    manifest.minimum_chrome_version = '144';

    assert.throws(
      () => createPackagedNetworkPolicyRules(manifest, 'main'),
      /require Chrome 145/u,
    );
  });

  it('skips manifests without a packaged network policy', () => {
    const manifest = createManifest();
    delete manifest.declarative_net_request;

    assert.equal(createPackagedNetworkPolicyRules(manifest, 'main'), undefined);
  });

  it('skips MV2 manifests', () => {
    const manifest = createManifest();
    manifest.manifest_version = 2;

    assert.equal(createPackagedNetworkPolicyRules(manifest, 'main'), undefined);
  });

  it('returns fresh rule objects for each build', () => {
    const first = createPackagedNetworkPolicyRules(createManifest(), 'main');
    assert.ok(first);
    assert.ok(first[0].condition.initiatorDomains);
    assert.ok(first[0].condition.resourceTypes);
    first[0].condition.initiatorDomains.push(
      'hebhblbkkdabgoldnojllkipeoacjioc',
    );
    first[0].condition.resourceTypes.length = 0;

    assert.deepEqual(
      createPackagedNetworkPolicyRules(createManifest(), 'main'),
      createBlockedNetworkPolicyRules(METAMASK_PROD_CHROME_ID),
    );
  });

  it('packages only exact fixture HTTP and background socket requests in test builds', () => {
    const rules = createPackagedNetworkPolicyRules(
      createManifest(),
      'main',
      true,
    );
    assert.ok(rules);
    const fixtureRules = rules.filter(({ action }) => action.type === 'allow');

    assert.equal(fixtureRules.length, 4);
    assert.deepEqual(
      fixtureRules.slice(0, 2).map(({ condition }) => condition),
      [
        {
          regexFilter: '^http://localhost:12345/state\\.json$',
          isUrlFilterCaseSensitive: true,
          requestMethods: ['get'],
          resourceTypes: ['xmlhttprequest'],
          initiatorDomains: [METAMASK_PROD_CHROME_ID],
        },
        {
          regexFilter: '^http://localhost:12345/state\\.json$',
          isUrlFilterCaseSensitive: true,
          requestMethods: ['get'],
          resourceTypes: ['xmlhttprequest'],
          topDomains: [METAMASK_PROD_CHROME_ID],
        },
      ],
    );
    for (const { condition } of fixtureRules.slice(0, 2)) {
      const pattern = new RegExp(condition.regexFilter as string, 'u');
      assert.equal(pattern.test('http://localhost:12345/state.json'), true);
      assert.equal(pattern.test('http://localhost:12345/stateXjson'), false);
      assert.equal(
        pattern.test('http://localhost:12345/state.json?extra=1'),
        false,
      );
      assert.equal(pattern.test('http://localhost:12346/state.json'), false);
    }
    assert.deepEqual(
      fixtureRules.slice(2).map(({ condition }) => condition),
      [
        {
          regexFilter: '^ws://localhost:8111/$',
          resourceTypes: ['websocket'],
          initiatorDomains: [METAMASK_PROD_CHROME_ID],
        },
        {
          regexFilter: '^ws://localhost:8111/$',
          resourceTypes: ['websocket'],
          topDomains: [METAMASK_PROD_CHROME_ID],
        },
      ],
    );
  });

  it('compiles the explicit fixture server port for LLM workflow builds', () => {
    const manifest = {
      ...createManifest(),
      _flags: { testing: { fixtureServerPort: 23456 } },
    };

    const rules = createPackagedNetworkPolicyRules(manifest, 'main');
    assert.ok(rules);
    const allowRules = rules.filter(({ action }) => action.type === 'allow');

    assert.equal(allowRules.length, 2);
    assert.ok(
      allowRules.every(
        ({ condition }) =>
          condition.regexFilter === '^http://localhost:23456/state\\.json$',
      ),
    );
  });

  it('omits fixture-state access when the fixture store is disabled', () => {
    const manifest = {
      ...createManifest(),
      _flags: {
        testing: { fixtureServerPort: 23456, forceExtensionStore: true },
      },
    };

    const rules = createPackagedNetworkPolicyRules(manifest, 'main');

    assert.deepEqual(
      rules,
      createBlockedNetworkPolicyRules(METAMASK_PROD_CHROME_ID),
    );
  });
});
