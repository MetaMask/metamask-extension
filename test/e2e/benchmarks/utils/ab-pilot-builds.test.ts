import fs from 'fs';
import os from 'os';
import path from 'path';
import { getMarkerKey } from './ab-pilot';
import { prepareAbBuilds } from './ab-pilot-builds';

describe('prepareAbBuilds', () => {
  let workDir: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-builds-'));
    const source = path.join(workDir, 'dist', 'chrome');
    fs.mkdirSync(path.join(source, 'scripts'), { recursive: true });
    fs.writeFileSync(
      path.join(source, 'manifest.json'),
      JSON.stringify({ name: 'MetaMask', version: '1.0.0' }),
    );
    fs.writeFileSync(path.join(source, 'scripts', 'app.js'), 'console.log(1)');
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  it('creates two copies that differ only in the manifest marker', () => {
    const summary = prepareAbBuilds({
      browser: 'chrome',
      sourceDirectory: 'dist/chrome',
      baseDirectory: workDir,
    });

    const manifestA = JSON.parse(
      fs.readFileSync(
        path.join(workDir, 'dist/chrome-a/manifest.json'),
        'utf8',
      ),
    );
    const manifestB = JSON.parse(
      fs.readFileSync(
        path.join(workDir, 'dist/chrome-b/manifest.json'),
        'utf8',
      ),
    );
    expect(manifestA).toStrictEqual({
      name: 'MetaMask',
      version: '1.0.0',
      [getMarkerKey('chrome')]: 'pilot-A',
    });
    expect(manifestB.version_name).toBe('pilot-B');
    expect(summary.fileCount).toBe(2);
    expect(summary.manifestHashes.A).not.toBe(summary.manifestHashes.B);
  });

  it('uses short_name as the marker for Firefox', () => {
    const summary = prepareAbBuilds({
      browser: 'firefox',
      sourceDirectory: 'dist/chrome',
      baseDirectory: workDir,
    });

    expect(summary.markerKey).toBe('short_name');
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(workDir, 'dist/firefox-a/manifest.json'),
        'utf8',
      ),
    );
    expect(manifest.short_name).toBe('pilot-A');
  });

  it('keeps the donor build untouched', () => {
    prepareAbBuilds({
      browser: 'chrome',
      sourceDirectory: 'dist/chrome',
      baseDirectory: workDir,
    });

    const original = JSON.parse(
      fs.readFileSync(path.join(workDir, 'dist/chrome/manifest.json'), 'utf8'),
    );
    expect(original).toStrictEqual({ name: 'MetaMask', version: '1.0.0' });
  });
});
