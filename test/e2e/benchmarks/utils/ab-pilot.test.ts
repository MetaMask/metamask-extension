import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  beginAbSession,
  endAbSession,
  getAbPilotRecord,
  getBuildForIndex,
  getMarkerKey,
  getMarkerValue,
  resetAbPilot,
} from './ab-pilot';

describe('ab-pilot', () => {
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();
  let workDir: string;

  function writeBuild(directory: string, marker: string) {
    const dir = path.join(workDir, directory);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'manifest.json'),
      JSON.stringify({ [getMarkerKey('chrome')]: marker }),
    );
  }

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-pilot-'));
    process.chdir(workDir);
    process.env.BENCHMARK_AB_PILOT = '1';
    process.env.SELENIUM_BROWSER = 'chrome';
    process.env.BENCHMARK_AB_SEQUENCE = 'ABBA';
    delete process.env.BENCHMARK_AB_FLIP;
    delete process.env.BENCHMARK_EXTENSION_DIR;
    resetAbPilot();
    writeBuild('dist/chrome-a', getMarkerValue('A'));
    writeBuild('dist/chrome-b', getMarkerValue('B'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  describe('getBuildForIndex', () => {
    it('repeats the sequence', () => {
      const builds = [0, 1, 2, 3, 4, 5].map((i) =>
        getBuildForIndex(i, 'ABBA', false),
      );
      expect(builds).toStrictEqual(['A', 'B', 'B', 'A', 'A', 'B']);
    });

    it('swaps the builds when flipped', () => {
      expect(getBuildForIndex(0, 'ABBA', true)).toBe('B');
      expect(getBuildForIndex(1, 'ABBA', true)).toBe('A');
    });

    it('rejects an invalid sequence', () => {
      expect(() => getBuildForIndex(0, 'AXB', false)).toThrow(
        'Invalid A/B sequence',
      );
    });
  });

  describe('beginAbSession', () => {
    it('does nothing when the pilot is disabled', () => {
      delete process.env.BENCHMARK_AB_PILOT;

      expect(beginAbSession(0)).toBeUndefined();
      expect(process.env.BENCHMARK_EXTENSION_DIR).toBeUndefined();
      expect(getAbPilotRecord()).toBeUndefined();
    });

    it('points the drivers at the selected build and records the session', () => {
      expect(beginAbSession(1)).toBe('B');
      endAbSession(1, { success: true, pageLoads: 10 });

      expect(process.env.BENCHMARK_EXTENSION_DIR).toBe(
        path.join('dist', 'chrome-b'),
      );
      expect(getAbPilotRecord()?.sessions).toMatchObject([
        {
          index: 1,
          build: 'B',
          marker: 'pilot-B',
          success: true,
          pageLoads: 10,
        },
      ]);
    });

    it('throws when the directory carries the wrong marker', () => {
      writeBuild('dist/chrome-a', 'pilot-B');

      expect(() => beginAbSession(0)).toThrow('expected pilot-A');
    });
  });
});
