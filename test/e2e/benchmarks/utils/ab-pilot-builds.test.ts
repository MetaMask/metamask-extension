import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import { getMarkerKey } from './ab-pilot';
import {
  getInjectionSnippet,
  getLastHomeScript,
  INJECTION_MARK,
  preparePairBuilds,
} from './ab-pilot-builds';

describe('getInjectionSnippet', () => {
  it('runs and records its duration in a performance mark', () => {
    let clock = 10;
    const now = jest.fn(() => {
      clock += 4;
      return clock;
    });
    const mark = jest.fn();
    vm.runInNewContext(getInjectionSnippet(20), { performance: { now, mark } });

    expect(mark).toHaveBeenCalledWith(INJECTION_MARK, {
      detail: { targetMs: 20, ms: 24, spins: 4 },
    });
  });
});

describe('getLastHomeScript', () => {
  it('returns the last script home.html loads', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-home-'));
    fs.writeFileSync(
      path.join(dir, 'home.html'),
      ['a', 'b', 'c']
        .map((name) => `<script src="scripts/${name}.js"></script>`)
        .join(''),
    );
    expect(getLastHomeScript(dir)).toBe('scripts/c.js');
    fs.writeFileSync(path.join(dir, 'home.html'), '<html></html>');
    expect(() => getLastHomeScript(dir)).toThrow('No script found');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('preparePairBuilds', () => {
  let workDir: string;

  const writeBuild = (dir: string, app: string, version: string) => {
    const root = path.join(workDir, dir);
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'manifest.json'),
      JSON.stringify({ name: 'MetaMask', version }),
    );
    fs.writeFileSync(path.join(root, 'scripts', 'app.js'), app);
    fs.writeFileSync(
      path.join(root, 'home.html'),
      '<script src="scripts/app.js"></script>',
    );
  };

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-pair-'));
    writeBuild('base', 'console.log(1)', '1.0.0');
    writeBuild('head', 'console.log(2)', '1.0.1');
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  it('copies the base build to A and the head build to B with their markers', () => {
    const summary = preparePairBuilds({
      browser: 'chrome',
      baseSource: 'base',
      headSource: 'head',
      baseDirectory: workDir,
    });

    const read = (dir: string, file: string) =>
      fs.readFileSync(path.join(workDir, dir, file), 'utf8');
    expect(read('dist/chrome-a', 'scripts/app.js')).toBe('console.log(1)');
    expect(read('dist/chrome-b', 'scripts/app.js')).toBe('console.log(2)');
    expect(JSON.parse(read('dist/chrome-a', 'manifest.json'))).toStrictEqual({
      name: 'MetaMask',
      version: '1.0.0',
      [getMarkerKey('chrome')]: 'pilot-A',
    });
    expect(
      JSON.parse(read('dist/chrome-b', 'manifest.json')).version_name,
    ).toBe('pilot-B');
    expect(summary.builds.A.version).toBe('1.0.0');
    expect(summary.builds.B.version).toBe('1.0.1');
    expect(summary.differingFiles).toBe(1);
    expect(summary.builds.A.contentHash).not.toBe(summary.builds.B.contentHash);
  });

  it('reports no differing files for two identical builds', () => {
    writeBuild('head', 'console.log(1)', '1.0.0');

    const summary = preparePairBuilds({
      browser: 'chrome',
      baseSource: 'base',
      headSource: 'head',
      baseDirectory: workDir,
    });

    expect(summary.differingFiles).toBe(0);
    expect(summary.builds.A.contentHash).toBe(summary.builds.B.contentHash);
  });

  it('counts an injected head delay in the summary', () => {
    writeBuild('head', 'console.log(1)', '1.0.0');

    const summary = preparePairBuilds({
      browser: 'chrome',
      baseSource: 'base',
      headSource: 'head',
      baseDirectory: workDir,
      injectHeadMs: 5,
    });

    expect(summary.differingFiles).toBe(1);
    expect(summary.builds.A.contentHash).not.toBe(summary.builds.B.contentHash);
    expect(
      fs.readFileSync(
        path.join(workDir, summary.directories.B, 'scripts', 'app.js'),
        'utf8',
      ),
    ).toContain(INJECTION_MARK);
  });

  it('uses short_name as the marker for Firefox and leaves the sources untouched', () => {
    const summary = preparePairBuilds({
      browser: 'firefox',
      baseSource: 'base',
      headSource: 'head',
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
    const original = JSON.parse(
      fs.readFileSync(path.join(workDir, 'base/manifest.json'), 'utf8'),
    );
    expect(original).toStrictEqual({ name: 'MetaMask', version: '1.0.0' });
  });

  it('throws when a build has no home.html', () => {
    fs.rmSync(path.join(workDir, 'head', 'home.html'));

    expect(() =>
      preparePairBuilds({
        browser: 'chrome',
        baseSource: 'base',
        headSource: 'head',
        baseDirectory: workDir,
      }),
    ).toThrow('No home.html in head');
  });
});
