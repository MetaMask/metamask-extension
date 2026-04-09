import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  collectBrowserifyBundleSizeArtifact,
  collectWebpackBundleSizeArtifactFromStats,
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

async function writeSizedFile(
  rootDirectory: string,
  relativePath: string,
  size: number,
) {
  const filePath = path.join(rootDirectory, relativePath);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.alloc(size));
}

describe('bundle-size collector', () => {
  it('collects browserify bundle sizes with content scripts in schema v2', async () => {
    await withTempDirectory(async (distDirectory) => {
      await Promise.all([
        writeSizedFile(distDirectory, 'background-1.js', 100),
        writeSizedFile(distDirectory, 'common-1.js', 50),
        writeSizedFile(distDirectory, 'ui-1.js', 200),
        writeSizedFile(distDirectory, 'scripts/runtime-lavamoat.js', 10),
        writeSizedFile(distDirectory, 'scripts/lockdown-more.js', 20),
        writeSizedFile(distDirectory, 'scripts/sentry-install.js', 30),
        writeSizedFile(distDirectory, 'scripts/policy-load.js', 40),
        writeSizedFile(distDirectory, 'scripts/contentscript.js', 5),
        writeSizedFile(distDirectory, 'scripts/inpage.js', 6),
        writeSizedFile(distDirectory, 'vendor/trezor/content-script.js', 7),
        writeSizedFile(distDirectory, 'ignored.js.map', 999),
      ]);

      const artifact = await collectBrowserifyBundleSizeArtifact(distDirectory);
      const summary = createBundleSizeSummary(artifact);

      assert.strictEqual(artifact.schemaVersion, 2);
      assert.strictEqual(artifact.bundler, 'browserify');
      assert.deepStrictEqual(
        artifact.background.fileList.map((file) => file.name),
        [
          'background-1.js',
          'scripts/lockdown-more.js',
          'scripts/policy-load.js',
          'scripts/runtime-lavamoat.js',
          'scripts/sentry-install.js',
        ],
      );
      assert.deepStrictEqual(
        artifact.ui.fileList.map((file) => file.name),
        ['ui-1.js'],
      );
      assert.deepStrictEqual(
        artifact.common.fileList.map((file) => file.name),
        ['common-1.js'],
      );
      assert.deepStrictEqual(
        artifact.contentScripts.fileList.map((file) => file.name),
        [
          'scripts/contentscript.js',
          'scripts/inpage.js',
          'vendor/trezor/content-script.js',
        ],
      );
      assert.strictEqual(artifact.background.size, 200);
      assert.strictEqual(artifact.ui.size, 200);
      assert.strictEqual(artifact.common.size, 50);
      assert.strictEqual(artifact.contentScripts.size, 18);
      assert.deepStrictEqual(
        {
          schemaVersion: summary.schemaVersion,
          bundler: summary.bundler,
          background: summary.background,
          ui: summary.ui,
          common: summary.common,
          contentScripts: summary.contentScripts,
        },
        {
          schemaVersion: 2,
          bundler: 'browserify',
          background: 200,
          ui: 200,
          common: 50,
          contentScripts: 18,
        },
      );
    });
  });

  it('classifies webpack assets into background, ui, common, and content scripts', () => {
    const artifact = collectWebpackBundleSizeArtifactFromStats({
      assets: [
        { name: 'runtime.js', size: 100 },
        { name: 'popup-ui.js', size: 200 },
        { name: 'background-ui.js', size: 300 },
        { name: 'bg-only.js', size: 400 },
        { name: 'bootstrap.js', size: 50 },
        { name: 'scripts/contentscript.js', size: 10 },
        { name: 'scripts/inpage.js', size: 20 },
        { name: 'vendor/trezor/content-script.js', size: 30 },
        { name: 'styles.css', size: 999 },
      ],
      entrypoints: {
        bootstrap: { assets: ['bootstrap.js'] },
        home: { assets: ['runtime.js', 'popup-ui.js'] },
        notification: { assets: ['runtime.js', 'popup-ui.js'] },
        popup: { assets: ['runtime.js', 'popup-ui.js'] },
        sidepanel: { assets: ['runtime.js', 'popup-ui.js'] },
        'service-worker.js': { assets: ['background-ui.js'] },
        offscreen: { assets: ['runtime.js', 'bg-only.js'] },
        'trezor-usb-permissions': { assets: ['runtime.js', 'bg-only.js'] },
        'scripts/contentscript.js': { assets: ['scripts/contentscript.js'] },
        'scripts/inpage.js': { assets: ['scripts/inpage.js'] },
        'vendor/trezor/content-script.js': {
          assets: ['vendor/trezor/content-script.js'],
        },
      },
    });

    assert.strictEqual(artifact.schemaVersion, 2);
    assert.strictEqual(artifact.bundler, 'webpack');
    assert.deepStrictEqual(
      artifact.common.fileList.map((file) => file.name),
      ['runtime.js'],
    );
    assert.deepStrictEqual(
      artifact.ui.fileList.map((file) => file.name),
      ['bootstrap.js', 'popup-ui.js'],
    );
    assert.deepStrictEqual(
      artifact.background.fileList.map((file) => file.name),
      ['background-ui.js', 'bg-only.js'],
    );
    assert.deepStrictEqual(
      artifact.contentScripts.fileList.map((file) => file.name),
      [
        'scripts/contentscript.js',
        'scripts/inpage.js',
        'vendor/trezor/content-script.js',
      ],
    );
    assert.strictEqual(artifact.common.size, 100);
    assert.strictEqual(artifact.ui.size, 250);
    assert.strictEqual(artifact.background.size, 700);
    assert.strictEqual(artifact.contentScripts.size, 60);
    assert.ok(
      artifact.background.fileList.every(
        (file) =>
          !file.name.includes('contentscript') && !file.name.includes('inpage'),
      ),
    );
  });
});
