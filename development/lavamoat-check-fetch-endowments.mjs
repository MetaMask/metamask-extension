#!/usr/bin/env node
/**
 * Guard: packages that call `globalThis.fetch.bind(globalThis)` under LavaMoat
 * must be endowed with full `fetch` (and `btoa` where needed), not only
 * `fetch.bind` / `btoa.bind`.
 *
 * Why: `nativeFetch.bind(compartmentGlobalThis)` still calls the host `fetch`
 * with a non-WorkerGlobalScope `this`, which throws:
 *   Failed to execute 'fetch' on 'WorkerGlobalScope': Illegal invocation
 * Full `fetch: true` installs LavaMoat's this-unwrapping wrapper, which is safe.
 *
 * Durable fix lives in lavamoat/webpack policy-override.json files so
 * `yarn lavamoat:auto` cannot regress the runtime endowment.
 *
 * Usage: node development/lavamoat-check-fetch-endowments.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { loadPoliciesSync } = require('lavamoat-core');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const webpackPolicyRoot = path.join(repoRoot, 'lavamoat', 'webpack');

/** Resources that must receive a full `fetch` endowment (not only `fetch.bind`). */
const REQUIRED_FETCH_RESOURCES = [
  '@metamask/network-controller',
  '@metamask/assets-controller',
  '@metamask/snaps-controllers',
];

/** Resources that also need full `btoa` (network-controller uses btoa.bind). */
const REQUIRED_BTOA_RESOURCES = ['@metamask/network-controller'];

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listPolicyLocations(dir) {
  /** @type {string[]} */
  const locations = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip build-tooling policy (not extension runtime).
      if (entry.name === 'build') {
        continue;
      }
      locations.push(...listPolicyLocations(full));
    }
  }
  // A "location" is a directory that contains both policy.json and policy-override.json
  const policyPath = path.join(dir, 'policy.json');
  const overridePath = path.join(dir, 'policy-override.json');
  try {
    if (statSync(policyPath).isFile() && statSync(overridePath).isFile()) {
      locations.push(dir);
    }
  } catch {
    // not a policy location
  }
  return locations;
}

/**
 * @param {string} location
 * @returns {{ location: string, errors: string[] }}
 */
function checkLocation(location) {
  const { applyOverride } = loadPoliciesSync({
    policyPath: path.join(location, 'policy.json'),
    policyOverridePath: path.join(location, 'policy-override.json'),
    debugMode: false,
  });

  const policy = JSON.parse(
    readFileSync(path.join(location, 'policy.json'), 'utf8'),
  );
  const effective = applyOverride(policy);
  /** @type {string[]} */
  const errors = [];
  const rel = path.relative(repoRoot, location);

  for (const resourceId of REQUIRED_FETCH_RESOURCES) {
    const globals = effective.resources?.[resourceId]?.globals ?? {};
    if (globals.fetch !== true) {
      errors.push(
        `${rel}: resource "${resourceId}" effective globals must include "fetch": true (got ${JSON.stringify(globals)})`,
      );
    }
    if (globals['fetch.bind'] === true && globals.fetch !== true) {
      errors.push(
        `${rel}: resource "${resourceId}" still only has "fetch.bind" without full "fetch"`,
      );
    }
  }

  for (const resourceId of REQUIRED_BTOA_RESOURCES) {
    const globals = effective.resources?.[resourceId]?.globals ?? {};
    if (globals.btoa !== true) {
      errors.push(
        `${rel}: resource "${resourceId}" effective globals must include "btoa": true (got ${JSON.stringify(globals)})`,
      );
    }
  }

  // Override durability: network-controller must pin fetch/btoa in override so
  // regenerating policy.json cannot regress runtime endowments.
  const override = JSON.parse(
    readFileSync(path.join(location, 'policy-override.json'), 'utf8'),
  );
  const ncOverrideGlobals =
    override.resources?.['@metamask/network-controller']?.globals ?? {};
  if (ncOverrideGlobals.fetch !== true || ncOverrideGlobals.btoa !== true) {
    errors.push(
      `${rel}: policy-override.json must pin @metamask/network-controller globals.fetch and globals.btoa to true (survives yarn lavamoat:auto)`,
    );
  }

  return { location: rel, errors };
}

function main() {
  const locations = listPolicyLocations(webpackPolicyRoot);
  if (locations.length === 0) {
    console.error(
      'lavamoat-check-fetch-endowments: no policy locations found under',
      webpackPolicyRoot,
    );
    process.exit(1);
  }

  /** @type {string[]} */
  const allErrors = [];
  for (const location of locations) {
    const { errors } = checkLocation(location);
    allErrors.push(...errors);
  }

  if (allErrors.length > 0) {
    console.error(
      'lavamoat-check-fetch-endowments: FAILED — LavaMoat fetch endowments are incorrect:\n',
    );
    for (const err of allErrors) {
      console.error(`  - ${err}`);
    }
    console.error(`
Fix: ensure lavamoat/webpack/**/policy-override.json includes:

  "@metamask/network-controller": {
    "globals": { "fetch": true, "btoa": true }
  }

Do NOT rely on "fetch.bind" / "btoa.bind" alone — that causes:
  Failed to execute 'fetch' on 'WorkerGlobalScope': Illegal invocation
`);
    process.exit(1);
  }

  console.log(
    `lavamoat-check-fetch-endowments: OK (${locations.length} policy locations)`,
  );
}

main();
