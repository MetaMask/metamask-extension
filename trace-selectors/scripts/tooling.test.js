const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { listExports } = require('./list-exports.js');
const { getSelectorDeps, expandChainSymbols } = require('./selector-deps.js');
const { buildSummary } = require('./summary.js');

const scriptsDir = __dirname;

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

test('listExports reports public alias names and skips type exports', () => {
  const symbols = listExports(`
    export const getAsset = (state) => state;
    export { getTokensControllerAllTokens as getAllTokens };
    export {
      type Hidden,
      visible,
      localName as publicName,
    };
  `);
  assert.deepEqual(symbols, ['getAllTokens', 'getAsset', 'publicName', 'visible']);
});

test('selector deps keep the first dependency and parameterized calls', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'selector-deps-'));
  const filePath = path.join(directory, 'selectors.ts');
  fs.writeFileSync(
    filePath,
    `
      export const getChild = createSelector(
        getParent,
        (parent) => parent,
      );
      export const getWrapped = createParameterizedSelector(10)(
        getParent,
        (parent) => parent,
      );
      export const getCached = createParameterizedSelector(
        CACHE_SIZE,
      )(
        getParent,
        (parent) => parent,
      );
    `,
  );
  const deps = getSelectorDeps(filePath);
  assert.deepEqual(deps.getChild, ['getParent']);
  assert.deepEqual(deps.getWrapped, ['getParent']);
  assert.deepEqual(deps.getCached, ['getParent']);
  const chain = expandChainSymbols([filePath], new Set(['getParent']));
  assert.equal(chain.has('getChild'), true);
  assert.equal(chain.has('getWrapped'), true);
  assert.equal(chain.has('getCached'), true);
});

test('buildSummary flags missing selectors without dropping the file counts', () => {
  const summary = buildSummary({
    configPath: 'config.json',
    output: 'out.md',
    roots: [{ file: 'ui/selectors/assets.ts', selectors: ['missing'] }],
    unresolvedSelectors: [{ file: 'ui/selectors/assets.ts', selector: 'missing' }],
    completedCount: 2,
    entries: [
      {
        layer: 2,
        path: 'ui/hooks/useAsset.ts',
        symbols: 'getAsset, getAsset',
        type: 'hook',
        terminal: true,
      },
    ],
    truncated: false,
    maxLayers: 0,
  });
  assert.equal(summary.status, 'attention');
  assert.equal(summary.remaining.files, 1);
  assert.equal(summary.remaining.importedSymbolSlots, 1);
  assert.equal(summary.completedFileCount, 2);
});

test('trace-usage reruns are identical and ignore false importers', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-usage-'));
  writeFile(
    path.join(root, 'ui/selectors/assets.ts'),
    `
      export const getSeed = (state) => state.seed;
      export const getAsset = createSelector(
        getSeed,
        (seed) => seed,
      );
    `,
  );
  writeFile(
    path.join(root, 'ui/selectors/derived.ts'),
    `
      import { getAsset } from './assets';
      export const getDerived = createSelector(
        getAsset,
        (asset) => asset,
      );
    `,
  );
  writeFile(
    path.join(root, 'ui/selectors/nested/child.ts'),
    `import { getAsset } from '../assets';\n`,
  );
  writeFile(
    path.join(root, 'ui/selectors/barrel-dir/index.ts'),
    `
      import { getAsset } from '../assets';
      export const getFromBarrel = createSelector(
        getAsset,
        (asset) => asset,
      );
    `,
  );
  writeFile(
    path.join(root, 'ui/selectors/reexports.ts'),
    `
      import { getAsset } from './assets';
      export * from './barrel-dir';
    `,
  );
  writeFile(
    path.join(root, 'ui/pages/reexport-user.tsx'),
    `import { getFromBarrel } from '../selectors/reexports';\nexport const ReexportUser = () => null;\n`,
  );
  writeFile(
    path.join(root, 'ui/selectors/assets.test.ts'),
    `import { getAsset } from './assets';\n`,
  );
  writeFile(
    path.join(root, 'ui/hooks/useAsset.ts'),
    `import { getAsset } from '../selectors/assets';\nexport function useAsset() { return null; }\n`,
  );
  writeFile(
    path.join(root, 'ui/pages/home.tsx'),
    `import { getDerived } from '../selectors/derived';\nexport const Home = () => null;\n`,
  );
  writeFile(
    path.join(root, 'ui/components/barrel-user.tsx'),
    `import { getDerived } from '../../selectors';\nexport const BarrelUser = () => null;\n`,
  );
  writeFile(
    path.join(root, 'ui/other/assets.ts'),
    `export const getAsset = () => null;\n`,
  );
  writeFile(
    path.join(root, 'ui/other/reader.ts'),
    `import { getAsset } from './assets';\n`,
  );
  writeFile(
    path.join(root, 'app/scripts/foo.ts'),
    `import { getAsset } from '../../ui/selectors/assets';\n`,
  );
  writeFile(
    path.join(root, 'trace-selectors/noise.js'),
    `import { getAsset } from 'selectors/assets';\n`,
  );
  writeFile(
    path.join(root, 'completed.txt'),
    'ui/selectors/derived.ts\n',
  );
  writeFile(
    path.join(root, 'config.json'),
    JSON.stringify(
      {
        output: 'out/trace.md',
        completionFile: 'completed.txt',
        roots: [{ file: 'ui/selectors/assets.ts', selectors: ['getAsset'] }],
      },
      null,
      2,
    ),
  );

  function runTrace() {
    return spawnSync(
      process.execPath,
      [path.join(scriptsDir, 'trace-usage.js'), '--config', 'config.json'],
      { cwd: root, encoding: 'utf8' },
    );
  }

  const first = runTrace();
  assert.equal(first.status, 0, first.stderr);
  const outputNames = [
    'out/trace.md',
    'out/trace.json',
    'out/trace.by-type.csv',
    'out/trace.by-selector.csv',
    'out/trace.by-migration-selector.csv',
  ];
  const outputFiles = outputNames.map((file) => fs.readFileSync(path.join(root, file), 'utf8'));

  const second = runTrace();
  assert.equal(second.status, 0, second.stderr);
  outputFiles.forEach((contents, index) => {
    const file = outputNames[index];
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), contents);
  });

  const summary = JSON.parse(outputFiles[1]);
  assert.deepEqual(
    summary.files.map((file) => file.path).sort(),
    [
      'app/scripts/foo.ts',
      'ui/components/barrel-user.tsx',
      'ui/hooks/useAsset.ts',
      'ui/pages/home.tsx',
      'ui/pages/reexport-user.tsx',
      'ui/selectors/barrel-dir/index.ts',
      'ui/selectors/nested/child.ts',
      'ui/selectors/reexports.ts',
    ],
  );
  assert.equal(
    summary.files.some((file) => file.path === 'ui/selectors/derived.ts'),
    false,
  );
  assert.equal(summary.completedFileCount, 1);
  assert.equal(summary.status, 'ok');
  assert.equal(summary.schemaVersion, 3);
  assert.deepEqual(
    summary.edges.find((edge) => edge.to === 'ui/hooks/useAsset.ts'),
    {
      from: 'ui/selectors/assets.ts',
      to: 'ui/hooks/useAsset.ts',
      selectors: ['getAsset'],
      migrationSelectors: ['getAsset'],
      lines: [1],
    },
  );
  assert.deepEqual(
    summary.edges.find((edge) => edge.to === 'ui/pages/home.tsx'),
    {
      from: 'ui/selectors/derived.ts',
      to: 'ui/pages/home.tsx',
      selectors: ['getDerived'],
      migrationSelectors: ['getAsset'],
      lines: [1],
    },
  );
  assert.deepEqual(
    summary.files.find((file) => file.path === 'ui/hooks/useAsset.ts').lines,
    [1],
  );
  assert.equal(
    summary.edges.some((edge) => edge.to === 'ui/other/reader.ts'),
    false,
  );

  writeFile(
    path.join(root, 'bad.json'),
    JSON.stringify({
      output: 'out/bad.md',
      roots: [{ file: 'ui/selectors/assets.ts', selectors: ['missingSelector'] }],
    }),
  );
  const drifted = spawnSync(
    process.execPath,
    [path.join(scriptsDir, 'trace-usage.js'), '--config', 'bad.json'],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(drifted.status, 3, drifted.stderr);
  const driftedSummary = JSON.parse(fs.readFileSync(path.join(root, 'out/bad.json'), 'utf8'));
  assert.equal(driftedSummary.status, 'attention');
  assert.deepEqual(driftedSummary.unresolvedSelectors, [
    { file: 'ui/selectors/assets.ts', selector: 'missingSelector' },
  ]);
});

test('aliases keep the assets-migration selector they rename', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-alias-'));
  writeFile(
    path.join(root, 'shared/lib/selectors/assets-migration.ts'),
    `export const getTokensControllerAllTokens = (state) => state.tokens;\n`,
  );
  writeFile(
    path.join(root, 'ui/selectors/selectors.js'),
    `
      import { getTokensControllerAllTokens } from '../../shared/lib/selectors/assets-migration';
      export { getTokensControllerAllTokens as getAllTokens };
      export const selectAllTokensFlat = createSelector(
        getTokensControllerAllTokens,
        (tokens) => tokens,
      );
    `,
  );
  writeFile(
    path.join(root, 'ui/hooks/useTokens.ts'),
    `import { getAllTokens, selectAllTokensFlat } from '../selectors/selectors';\nexport function useTokens() { return null; }\n`,
  );
  writeFile(
    path.join(root, 'config.json'),
    JSON.stringify({
      output: 'out/trace.md',
      roots: [{ file: 'shared/lib/selectors/assets-migration.ts' }],
    }),
  );
  const result = spawnSync(
    process.execPath,
    [path.join(scriptsDir, 'trace-usage.js'), '--config', 'config.json'],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(fs.readFileSync(path.join(root, 'out/trace.json'), 'utf8'));
  assert.deepEqual(
    summary.edges.find((edge) => edge.to === 'ui/hooks/useTokens.ts'),
    {
      from: 'ui/selectors/selectors.js',
      to: 'ui/hooks/useTokens.ts',
      selectors: ['getAllTokens', 'selectAllTokensFlat'],
      migrationSelectors: ['getTokensControllerAllTokens'],
      lines: [1],
    },
  );
  assert.deepEqual(
    summary.files.find((file) => file.path === 'ui/selectors/selectors.js').migrationSelectors,
    ['getTokensControllerAllTokens'],
  );
});
