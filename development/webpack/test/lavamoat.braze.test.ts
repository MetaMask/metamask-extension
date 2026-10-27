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
  'EventSource',
  'Notification',
  'ServiceWorkerRegistration',
  'atob',
  'btoa',
  'innerHeight',
  'innerWidth',
  'localStorage',
  'open',
  'orientation',
  'safari',
];

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
});
