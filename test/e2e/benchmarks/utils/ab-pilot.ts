/**
 * Same-machine two-build pilot. Each browser session (startup) or iteration
 * (journeys) loads build A or build B, two copies of one donor build that differ
 * only in a manifest marker. Enabled by BENCHMARK_AB_PILOT; inert otherwise.
 */
import fs from 'fs';
import path from 'path';

export type AbBuild = 'A' | 'B';

export type AbSessionRecord = {
  index: number;
  build: AbBuild;
  marker: string;
  directory: string;
  startedAt: string;
  success?: boolean;
  pageLoads?: number;
  timers?: Record<string, number>;
  // Busy-wait milliseconds per page load; null where the build has no injection.
  injectedMs?: (number | null)[];
};

export type AbPilotRecord = {
  sequence: string;
  flip: boolean;
  sessions: AbSessionRecord[];
};

const DEFAULT_SEQUENCE = 'ABBABAABAB';

// Chrome honors version_name; Firefox ignores it, so use short_name there.
export function getMarkerKey(browser: string): string {
  return browser === 'firefox' ? 'short_name' : 'version_name';
}

export function getMarkerValue(build: AbBuild): string {
  return `pilot-${build}`;
}

export function getBuildDirectory(browser: string, build: AbBuild): string {
  return path.join('dist', `${browser}-${build.toLowerCase()}`);
}

export function isAbPilotEnabled(): boolean {
  return process.env.BENCHMARK_AB_PILOT === '1';
}

/**
 * @param index - Zero-based session or iteration index.
 * @param sequence - Pattern of A and B, repeated when shorter than the run.
 * @param flip - Swap A and B, so which copy goes first is randomized per job.
 */
export function getBuildForIndex(
  index: number,
  sequence: string,
  flip: boolean,
): AbBuild {
  if (!/^[AB]+$/u.test(sequence)) {
    throw new Error(`Invalid A/B sequence "${sequence}"`);
  }
  const letter = sequence[index % sequence.length] as AbBuild;
  if (!flip) {
    return letter;
  }
  return letter === 'A' ? 'B' : 'A';
}

let sessions: AbSessionRecord[] = [];

export function resetAbPilot(): void {
  sessions = [];
}

function readMarker(directory: string, browser: string): string | undefined {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'),
  );
  return manifest[getMarkerKey(browser)];
}

/**
 * Selects the build for the next session and points the drivers at it. Throws
 * when the directory does not carry the expected marker, so a session never
 * runs the wrong build unnoticed.
 *
 * @param index - Zero-based session or iteration index.
 */
export function beginAbSession(index: number): AbBuild | undefined {
  if (!isAbPilotEnabled()) {
    return undefined;
  }
  const browser = process.env.SELENIUM_BROWSER ?? 'chrome';
  const sequence = process.env.BENCHMARK_AB_SEQUENCE || DEFAULT_SEQUENCE;
  const flip = process.env.BENCHMARK_AB_FLIP === '1';
  const build = getBuildForIndex(index, sequence, flip);
  const directory = getBuildDirectory(browser, build);
  const marker = readMarker(directory, browser);
  if (marker !== getMarkerValue(build)) {
    throw new Error(
      `A/B pilot: ${directory} has marker ${marker}, expected ${getMarkerValue(build)}`,
    );
  }
  process.env.BENCHMARK_EXTENSION_DIR = directory;
  sessions.push({
    index,
    build,
    marker,
    directory,
    startedAt: new Date().toISOString(),
  });
  return build;
}

export function endAbSession(
  index: number,
  details: Pick<
    AbSessionRecord,
    'success' | 'pageLoads' | 'timers' | 'injectedMs'
  >,
): void {
  if (!isAbPilotEnabled()) {
    return;
  }
  const record = sessions.find((session) => session.index === index);
  if (record) {
    Object.assign(record, details);
  }
}

export function getAbPilotRecord(): AbPilotRecord | undefined {
  if (!isAbPilotEnabled()) {
    return undefined;
  }
  return {
    sequence: process.env.BENCHMARK_AB_SEQUENCE || DEFAULT_SEQUENCE,
    flip: process.env.BENCHMARK_AB_FLIP === '1',
    sessions: [...sessions],
  };
}
