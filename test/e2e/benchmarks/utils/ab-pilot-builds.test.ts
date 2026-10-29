import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import { getMarkerKey } from './ab-pilot';
import {
  getInjectionSnippet,
  INJECTION_MARK,
  prepareAbBuilds,
} from './ab-pilot-builds';

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
    fs.writeFileSync(
      path.join(source, 'home.html'),
      '<script src="scripts/app.js" defer="defer"></script>',
    );
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
    expect(summary.fileCount).toBe(3);
    expect(summary.manifestHashes.A).not.toBe(summary.manifestHashes.B);
    expect(summary.injection).toBeUndefined();
  });

  it('injects the busy-wait into the first home.html script of B only', () => {
    const summary = prepareAbBuilds({
      browser: 'chrome',
      sourceDirectory: 'dist/chrome',
      baseDirectory: workDir,
      injectIterations: 1000,
    });

    const read = (dir: string) =>
      fs.readFileSync(path.join(workDir, dir, 'scripts/app.js'), 'utf8');
    expect(read('dist/chrome-a')).toBe('console.log(1)');
    expect(read('dist/chrome-b')).toBe(
      `${getInjectionSnippet(1000)}console.log(1)`,
    );
    expect(summary.injection).toStrictEqual({
      file: 'scripts/app.js',
      iterations: 1000,
      hashes: { A: expect.any(String), B: expect.any(String) },
    });
    expect(summary.injection?.hashes.A).not.toBe(summary.injection?.hashes.B);
  });

  it('still rejects other differences when injecting', () => {
    const source = path.join(workDir, 'dist', 'chrome');
    fs.writeFileSync(path.join(source, 'other.js'), 'x');
    const realCpSync = fs.cpSync;
    jest.spyOn(fs, 'cpSync').mockImplementation((from, to, options) => {
      realCpSync(from, to, options);
      if (String(to).endsWith('chrome-b')) {
        fs.writeFileSync(path.join(String(to), 'other.js'), 'y');
      }
    });

    expect(() =>
      prepareAbBuilds({
        browser: 'chrome',
        sourceDirectory: 'dist/chrome',
        baseDirectory: workDir,
        injectIterations: 0,
      }),
    ).toThrow('A/B builds differ outside');
    jest.restoreAllMocks();
  });

  it('rejects a negative or fractional iteration count', () => {
    expect(() =>
      prepareAbBuilds({
        browser: 'chrome',
        sourceDirectory: 'dist/chrome',
        baseDirectory: workDir,
        injectIterations: -1,
      }),
    ).toThrow('Invalid injection iterations -1');
  });

  it('runs and records its duration in a performance mark', () => {
    const now = jest.fn().mockReturnValueOnce(10).mockReturnValueOnce(35);
    const mark = jest.fn();
    vm.runInNewContext(getInjectionSnippet(500), {
      performance: { now, mark },
      Math,
    });

    expect(mark).toHaveBeenCalledWith(INJECTION_MARK, {
      detail: { iterations: 500, ms: 25, sink: expect.any(Number) },
    });
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
