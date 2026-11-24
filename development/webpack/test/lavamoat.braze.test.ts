import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

type GlobalsPolicy = Record<string, boolean | 'write'>;
type Policy = {
  resources: Record<string, { globals?: GlobalsPolicy }>;
};

const MANIFESTS = ['mv2', 'mv3'] as const;
const VARIANTS = ['main', 'beta', 'flask', 'experimental'] as const;

/**
 * Capabilities the SDK must not have. This is the security contract, not a copy
 * of the policy: granting one of these breaks identity or banner containment
 * (see "LavaMoat policy" and "Security" in `app/braze/braze.md`).
 */
const DENIED_GLOBALS = [
  // Push, real-time messaging and Braze-rendered content
  'EventSource',
  'Notification',
  'ServiceWorkerRegistration',
  'atob',
  'btoa',
  'innerHeight',
  'innerWidth',
  'open',
  'orientation',
  'safari',
  // Network egress other than XMLHttpRequest
  'fetch',
  'Request',
  'Headers',
  'Image',
  'WebSocket',
  // Dynamic code, workers and other realms
  'WebAssembly',
  'Worker',
  'SharedWorker',
  'importScripts',
  // Storage
  'localStorage',
  'sessionStorage',
  'indexedDB',
  // Other frames and documents
  'postMessage',
  'parent',
  'top',
  'opener',
  'frameElement',
  'history',
  // Extension APIs
  'chrome',
  'browser',
  // App hooks left on the real window for Sentry
  '__SENTRY__',
  'appState',
  'logEncryptedVault',
  'sentry',
  'sentryHooks',
  'stateHooks',
  // High-resolution timing
  'performance',
];

/**
 * Globals granted only in part. The whole object must stay denied so a
 * regenerated policy cannot widen it back.
 */
const NARROWED_GLOBALS: Record<string, string> = {
  crypto: 'crypto.getRandomValues',
  Intl: 'Intl.DateTimeFormat',
  location: 'location.href',
};

const readGlobals = (
  manifest: (typeof MANIFESTS)[number],
  variant: (typeof VARIANTS)[number],
  filename: string,
): GlobalsPolicy => {
  const path = resolve(
    __dirname,
    `../../../lavamoat/webpack/${manifest}/${variant}/${filename}.json`,
  );
  const policy = JSON.parse(readFileSync(path, 'utf8')) as Policy;
  return policy.resources['@braze/web-sdk'].globals ?? {};
};

const mergedGlobals = (
  manifest: (typeof MANIFESTS)[number],
  variant: (typeof VARIANTS)[number],
): GlobalsPolicy => ({
  ...readGlobals(manifest, variant, 'policy'),
  ...readGlobals(manifest, variant, 'policy-override'),
});

describe('Braze LavaMoat policy', () => {
  it('applies the same policy in every build variant', () => {
    const shapes = new Set(
      MANIFESTS.flatMap((manifest) =>
        VARIANTS.map((variant) =>
          JSON.stringify(
            Object.entries(mergedGlobals(manifest, variant)).sort(
              ([left], [right]) => left.localeCompare(right),
            ),
          ),
        ),
      ),
    );

    assert.equal(
      shapes.size,
      1,
      'the @braze/web-sdk policy drifted between build variants',
    );
  });

  it('keeps the denied capabilities denied in every build variant', () => {
    for (const manifest of MANIFESTS) {
      for (const variant of VARIANTS) {
        const globals = mergedGlobals(manifest, variant);

        for (const name of DENIED_GLOBALS) {
          assert.equal(
            globals[name] === true || globals[name] === 'write',
            false,
            `${manifest}/${variant} grants ${name}; see app/braze/braze.md`,
          );
        }
      }
    }
  });

  it('keeps narrowed globals to their single granted member', () => {
    for (const manifest of MANIFESTS) {
      for (const variant of VARIANTS) {
        const globals = mergedGlobals(manifest, variant);

        for (const [parent, child] of Object.entries(NARROWED_GLOBALS)) {
          assert.equal(
            globals[parent],
            false,
            `${manifest}/${variant} grants all of ${parent}; see app/braze/braze.md`,
          );
          assert.equal(globals[child], true);
          // lavamoat-core keeps only one re-allowed child under a denied parent.
          assert.deepEqual(
            Object.keys(globals).filter((name) =>
              name.startsWith(`${parent}.`),
            ),
            [child],
          );
        }
      }
    }
  });
});
