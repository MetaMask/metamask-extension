#!/usr/bin/env node
'use strict';

const { checkAssert } = require('./lib/assert');
const {
  getAppRoot,
  loadPreConditionRegistry,
  renderTemplate,
} = require('./lib/catalog');

function main() {
  const appRoot = getAppRoot();
  const registry = loadPreConditionRegistry(appRoot);
  const failures = [];

  Object.entries(registry).forEach(([name, entry]) => {
    const fixtures = entry.fixtures;
    if (!fixtures) {
      failures.push(`  ${name}: missing fixtures.pass and fixtures.fail`);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(fixtures, 'pass')) {
      failures.push(`  ${name}: missing fixtures.pass`);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(fixtures, 'fail')) {
      failures.push(`  ${name}: missing fixtures.fail`);
      return;
    }

    const params = fixtures.params || {};
    const assertSpec = renderTemplate(entry.assert, params);

    const passResult = checkAssert(fixtures.pass, assertSpec);
    if (!passResult) {
      failures.push(
        `  ${name}: pass fixture did not satisfy assert\n` +
          `    fixture: ${fixtures.pass}\n` +
          `    assert:  ${JSON.stringify(assertSpec)}`
      );
    }

    const failResult = checkAssert(fixtures.fail, assertSpec);
    if (failResult) {
      failures.push(
        `  ${name}: fail fixture unexpectedly satisfied assert\n` +
          `    fixture: ${fixtures.fail}\n` +
          `    assert:  ${JSON.stringify(assertSpec)}`
      );
    }
  });

  if (failures.length > 0) {
    console.error(`Pre-condition assertion check FAILED:\n${failures.join('\n')}`);
    process.exit(1);
  }

  console.log(
    `All ${Object.keys(registry).length} pre-condition(s) pass assertion correctness checks.`
  );
}

main();
