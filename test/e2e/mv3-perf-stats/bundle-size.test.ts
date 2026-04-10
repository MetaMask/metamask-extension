import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  collectBrowserifyBundleSizeArtifact,
  collectWebpackBundleSizeArtifact,
  createBundleSizeSummary,
} from './bundle-size';

async function withTempDirectory<TReturnValue>(
  callback: (directory: string) => Promise<TReturnValue>,
): Promise<TReturnValue> {
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'bundle-size-test-'));

  try {
    return await callback(directory);
  } finally {
    await fs.rm(directory, { force: true, recursive: true });
  }
}

async function writeFile(
  rootDirectory: string,
  relativePath: string,
  contents: string | Buffer,
) {
  const filePath = path.join(rootDirectory, relativePath);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents);
}

async function writeSizedFile(
  rootDirectory: string,
  relativePath: string,
  size: number,
) {
  await writeFile(rootDirectory, relativePath, Buffer.alloc(size));
}

const manifestVersionKey = 'manifest_version';
const serviceWorkerKey = 'service_worker';
const contentScriptsKey = 'content_scripts';

describe('bundle-size collector', () => {
  it('classifies browserify assets from emitted HTML and the MV3 service-worker bootstrap', async () => {
    await withTempDirectory(async (distDirectory) => {
      const appInitContents = [
        'loadFile("../scripts/sentry-install.js");',
        'loadFile("../scripts/runtime-lavamoat.js");',
        'loadFile("../scripts/lockdown-more.js");',
        'loadFile("../scripts/policy-load.js");',
        'const rawFileList = "../common-1.js,../background-1.js";',
      ].join('\n');

      await Promise.all([
        writeFile(
          distDirectory,
          'manifest.json',
          JSON.stringify({
            [manifestVersionKey]: 3,
            background: { [serviceWorkerKey]: 'scripts/app-init.js' },
            [contentScriptsKey]: [{ js: ['scripts/contentscript.js'] }],
          }),
        ),
        writeFile(
          distDirectory,
          'home.html',
          [
            '<script src="./scripts/sentry-install.js"></script>',
            '<script src="./scripts/runtime-lavamoat.js"></script>',
            '<script src="./scripts/lockdown-more.js"></script>',
            '<script src="./scripts/policy-load.js"></script>',
            '<script src="./common-1.js"></script>',
            '<script src="./ui-1.js"></script>',
          ].join('\n'),
        ),
        writeFile(
          distDirectory,
          'offscreen.html',
          [
            '<script src="./common-1.js"></script>',
            '<script src="./offscreen-0.js"></script>',
          ].join('\n'),
        ),
        writeFile(
          distDirectory,
          'trezor-usb-permissions.html',
          '<script src="./vendor/trezor/usb-permissions.js"></script>',
        ),
        writeFile(distDirectory, 'scripts/app-init.js', appInitContents),
        writeSizedFile(distDirectory, 'background-1.js', 100),
        writeSizedFile(distDirectory, 'common-1.js', 50),
        writeSizedFile(distDirectory, 'ui-1.js', 200),
        writeSizedFile(distDirectory, 'offscreen-0.js', 70),
        writeSizedFile(distDirectory, 'vendor/trezor/usb-permissions.js', 80),
        writeSizedFile(distDirectory, 'scripts/runtime-lavamoat.js', 10),
        writeSizedFile(distDirectory, 'scripts/lockdown-more.js', 20),
        writeSizedFile(distDirectory, 'scripts/sentry-install.js', 30),
        writeSizedFile(distDirectory, 'scripts/policy-load.js', 40),
        writeSizedFile(distDirectory, 'scripts/contentscript.js', 5),
        writeSizedFile(distDirectory, 'scripts/inpage.js', 6),
        writeSizedFile(distDirectory, 'vendor/trezor/content-script.js', 7),
        writeSizedFile(distDirectory, 'content-script-0.js', 999),
      ]);

      const artifact = await collectBrowserifyBundleSizeArtifact(distDirectory);
      const summary = createBundleSizeSummary(artifact);

      assert.strictEqual(artifact.schemaVersion, 4);
      assert.strictEqual(artifact.bundler, 'browserify');
      assert.deepStrictEqual(
        artifact.background.fileList.map((file) => file.name),
        ['background-1.js', 'scripts/app-init.js'],
      );
      assert.deepStrictEqual(
        artifact.ui.fileList.map((file) => file.name),
        ['ui-1.js'],
      );
      assert.deepStrictEqual(
        artifact.common.fileList.map((file) => file.name),
        [
          'common-1.js',
          'scripts/lockdown-more.js',
          'scripts/policy-load.js',
          'scripts/runtime-lavamoat.js',
          'scripts/sentry-install.js',
        ],
      );
      assert.deepStrictEqual(
        artifact.auxiliaryPages.fileList.map((file) => file.name),
        ['offscreen-0.js', 'vendor/trezor/usb-permissions.js'],
      );
      assert.deepStrictEqual(
        artifact.contentScripts.fileList.map((file) => file.name),
        [
          'scripts/contentscript.js',
          'scripts/inpage.js',
          'vendor/trezor/content-script.js',
        ],
      );
      assert.strictEqual(
        artifact.background.size,
        100 + Buffer.byteLength(appInitContents),
      );
      assert.strictEqual(artifact.ui.size, 200);
      assert.strictEqual(artifact.common.size, 150);
      assert.strictEqual(artifact.auxiliaryPages.size, 150);
      assert.strictEqual(artifact.contentScripts.size, 18);
      assert.deepStrictEqual(
        {
          schemaVersion: summary.schemaVersion,
          bundler: summary.bundler,
          background: summary.background,
          ui: summary.ui,
          common: summary.common,
          auxiliaryPages: summary.auxiliaryPages,
          contentScripts: summary.contentScripts,
        },
        {
          schemaVersion: 4,
          bundler: 'browserify',
          background: 100 + Buffer.byteLength(appInitContents),
          ui: 200,
          common: 150,
          auxiliaryPages: 150,
          contentScripts: 18,
        },
      );
    });
  });

  it('classifies webpack assets from emitted stats and service-worker async files', async () => {
    await withTempDirectory(async (rootDirectory) => {
      const distDirectory = path.join(rootDirectory, 'dist', 'chrome');
      const statsDirectory = path.join(
        rootDirectory,
        'dist',
        'bundle-analyzer',
      );

      await Promise.all([
        fs.mkdir(distDirectory, { recursive: true }),
        fs.mkdir(statsDirectory, { recursive: true }),
      ]);

      await Promise.all([
        writeFile(
          distDirectory,
          'manifest.json',
          JSON.stringify({
            [manifestVersionKey]: 3,
            background: { [serviceWorkerKey]: 'service-worker.js' },
            [contentScriptsKey]: [
              {
                js: [
                  'scripts/contentscript.js',
                  'scripts/inpage.js',
                  'vendor/trezor/content-script.js',
                ],
              },
            ],
          }),
        ),
        writeFile(
          distDirectory,
          'home.html',
          [
            '<script src="./runtime-ui.js"></script>',
            '<script src="./ui-vendor.js"></script>',
            '<script src="./ui.js"></script>',
            '<script src="./shared-ui-background.js"></script>',
          ].join('\n'),
        ),
        writeFile(
          distDirectory,
          'offscreen.html',
          [
            '<script src="./runtime-auxiliary-pages.js"></script>',
            '<script src="./auxiliary-pages.js"></script>',
          ].join('\n'),
        ),
        writeFile(
          distDirectory,
          'trezor-usb-permissions.html',
          [
            '<script src="./runtime-auxiliary-pages.js"></script>',
            '<script src="./auxiliary-pages.js"></script>',
            '<script src="./usb-permissions.js"></script>',
          ].join('\n'),
        ),
        writeSizedFile(distDirectory, 'service-worker.js', 100),
        writeSizedFile(distDirectory, 'background-vendor.js', 110),
        writeSizedFile(distDirectory, 'background.js', 120),
        writeSizedFile(distDirectory, 'shared-ui-background.js', 130),
        writeSizedFile(distDirectory, 'runtime-ui.js', 140),
        writeSizedFile(distDirectory, 'ui-vendor.js', 150),
        writeSizedFile(distDirectory, 'ui.js', 160),
        writeSizedFile(distDirectory, 'runtime-auxiliary-pages.js', 170),
        writeSizedFile(distDirectory, 'auxiliary-pages.js', 180),
        writeSizedFile(distDirectory, 'usb-permissions.js', 190),
        writeSizedFile(distDirectory, 'popup-init-async.js', 888),
        writeSizedFile(distDirectory, 'scripts/contentscript.js', 10),
        writeSizedFile(distDirectory, 'scripts/inpage.js', 20),
        writeSizedFile(distDirectory, 'vendor/trezor/content-script.js', 30),
        writeFile(
          statsDirectory,
          'stats.json',
          JSON.stringify({
            schemaVersion: 2,
            entrypoints: {
              home: {
                initialFiles: [
                  { name: 'runtime-ui.js', size: 140 },
                  { name: 'ui-vendor.js', size: 150 },
                  { name: 'ui.js', size: 160 },
                  { name: 'shared-ui-background.js', size: 130 },
                ],
                asyncFiles: [],
              },
              'service-worker.ts': {
                initialFiles: [{ name: 'service-worker.js', size: 100 }],
                asyncFiles: [
                  { name: 'background-vendor.js', size: 110 },
                  { name: 'background.js', size: 120 },
                  { name: 'shared-ui-background.js', size: 130 },
                ],
              },
              offscreen: {
                initialFiles: [
                  { name: 'runtime-auxiliary-pages.js', size: 170 },
                  { name: 'auxiliary-pages.js', size: 180 },
                ],
                asyncFiles: [],
              },
              'trezor-usb-permissions': {
                initialFiles: [
                  { name: 'runtime-auxiliary-pages.js', size: 170 },
                  { name: 'auxiliary-pages.js', size: 180 },
                  { name: 'usb-permissions.js', size: 190 },
                ],
                asyncFiles: [],
              },
              'popup-init': {
                initialFiles: [{ name: 'runtime-ui.js', size: 140 }],
                asyncFiles: [{ name: 'popup-init-async.js', size: 888 }],
              },
              'scripts/contentscript.js': {
                initialFiles: [{ name: 'scripts/contentscript.js', size: 10 }],
                asyncFiles: [],
              },
            },
          }),
        ),
      ]);

      const artifact = await collectWebpackBundleSizeArtifact(distDirectory);

      assert.strictEqual(artifact.schemaVersion, 4);
      assert.strictEqual(artifact.bundler, 'webpack');
      assert.deepStrictEqual(
        artifact.common.fileList.map((file) => file.name),
        ['shared-ui-background.js'],
      );
      assert.deepStrictEqual(
        artifact.ui.fileList.map((file) => file.name),
        ['runtime-ui.js', 'ui-vendor.js', 'ui.js'],
      );
      assert.deepStrictEqual(
        artifact.background.fileList.map((file) => file.name),
        ['background-vendor.js', 'background.js', 'service-worker.js'],
      );
      assert.deepStrictEqual(
        artifact.auxiliaryPages.fileList.map((file) => file.name),
        [
          'auxiliary-pages.js',
          'runtime-auxiliary-pages.js',
          'usb-permissions.js',
        ],
      );
      assert.deepStrictEqual(
        artifact.contentScripts.fileList.map((file) => file.name),
        [
          'scripts/contentscript.js',
          'scripts/inpage.js',
          'vendor/trezor/content-script.js',
        ],
      );
      assert.strictEqual(artifact.common.size, 130);
      assert.strictEqual(artifact.ui.size, 450);
      assert.strictEqual(artifact.background.size, 330);
      assert.strictEqual(artifact.auxiliaryPages.size, 540);
      assert.strictEqual(artifact.contentScripts.size, 60);
    });
  });
});
