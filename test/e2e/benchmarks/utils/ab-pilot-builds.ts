import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  getBuildDirectory,
  getMarkerKey,
  getMarkerValue,
  type AbBuild,
  // prepare-ab-builds.mts runs this file under plain Node, which needs the extension.
  // eslint-disable-next-line import-x/extensions
} from './ab-pilot.ts';

export const INJECTION_MARK = 'abInjected';

/**
 * Spins the main thread until targetMs has passed. A fixed iteration count is
 * not fixed work in Firefox, where loop speed depends on when JIT compilation
 * lands. The mark records the time spent; 0 keeps the hook but does no work.
 *
 * @param targetMs - Milliseconds to spin.
 */
export function getInjectionSnippet(targetMs: number): string {
  return (
    `;(function(){var n=${targetMs},t=performance.now(),s=0;` +
    'while(performance.now()-t<n){s++}' +
    `performance.mark('${INJECTION_MARK}',{detail:{targetMs:n,` +
    'ms:performance.now()-t,spins:s}})})();\n'
  );
}

/**
 * The last script home.html loads. It is the UI entry point, so work there
 * runs once every other script has loaded.
 *
 * @param directory - Unpacked build.
 */
export function getLastHomeScript(directory: string): string {
  const html = fs.readFileSync(path.join(directory, 'home.html'), 'utf8');
  const sources = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/gu)];
  if (sources.length === 0) {
    throw new Error('No script found in home.html');
  }
  return sources[sources.length - 1][1];
}

function listFiles(root: string, dir = ''): string[] {
  const entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
  return entries
    .flatMap((entry) => {
      const relative = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(root, relative) : [relative];
    })
    .sort();
}

function hashFile(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * Content hash of every file under `root`, keyed by its forward-slash path.
 *
 * @param root - Directory to hash.
 */
function hashTree(root: string): Map<string, string> {
  const hashes = new Map<string, string>();
  for (const file of listFiles(root)) {
    hashes.set(file.split(path.sep).join('/'), hashFile(path.join(root, file)));
  }
  return hashes;
}

/**
 * One hash over the paths and contents of every file not in `exclude`.
 *
 * @param hashes - Result of {@link hashTree}.
 * @param exclude - Forward-slash paths to leave out.
 */
function digestOf(hashes: Map<string, string>, exclude: string[]): string {
  const digest = createHash('sha256');
  for (const [file, hash] of hashes) {
    if (!exclude.includes(file)) {
      digest.update(`${file}\0${hash}\n`);
    }
  }
  return digest.digest('hex');
}

/**
 * Copies a build into the directory for A or B and stamps its manifest with
 * that build's marker.
 *
 * @param options - What to copy and where.
 * @param options.browser - `chrome` or `firefox`.
 * @param options.source - Absolute path of the unpacked build.
 * @param options.baseDirectory - Working directory the output path is under.
 * @param options.build - Which copy this is.
 */
function copyAndStamp({
  browser,
  source,
  baseDirectory,
  build,
}: {
  browser: string;
  source: string;
  baseDirectory: string;
  build: AbBuild;
}) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'),
  );
  const relative = getBuildDirectory(browser, build);
  const target = path.resolve(baseDirectory, relative);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
  const text = JSON.stringify(
    { ...manifest, [getMarkerKey(browser)]: getMarkerValue(build) },
    null,
    2,
  );
  fs.writeFileSync(path.join(target, 'manifest.json'), text);
  return {
    relative,
    target,
    version: manifest.version as string,
    manifestHash: createHash('sha256').update(text).digest('hex'),
  };
}

export type PairBuildsSummary = {
  browser: string;
  directories: Record<AbBuild, string>;
  manifestHashes: Record<AbBuild, string>;
  markerKey: string;
  // A is the base build and B is the head build.
  builds: Record<
    AbBuild,
    { source: string; fileCount: number; contentHash: string; version: string }
  >;
  differingFiles: number;
};

/**
 * Copies a base and a head build into the A and B directories and stamps each
 * with its manifest marker. The builds are expected to differ, so nothing is
 * asserted about their contents; the summary records what differs.
 *
 * @param options - Browser and the two unpacked builds.
 * @param options.browser - `chrome` or `firefox`.
 * @param options.baseSource - Unpacked base build, copied to the A directory.
 * @param options.headSource - Unpacked head build, copied to the B directory.
 * @param options.baseDirectory - Working directory the output paths are under.
 * @param options.injectHeadMs - Busy-wait to add to the head build before it is hashed, so the summary shows it.
 */
export function preparePairBuilds({
  browser,
  baseSource,
  headSource,
  baseDirectory = process.cwd(),
  injectHeadMs,
}: {
  browser: string;
  baseSource: string;
  headSource: string;
  baseDirectory?: string;
  injectHeadMs?: number;
}): PairBuildsSummary {
  const markerKey = getMarkerKey(browser);
  const sources: Record<AbBuild, string> = { A: baseSource, B: headSource };
  const directories = {} as Record<AbBuild, string>;
  const manifestHashes = {} as Record<AbBuild, string>;
  const builds = {} as PairBuildsSummary['builds'];
  const trees = {} as Record<AbBuild, Map<string, string>>;

  for (const build of ['A', 'B'] as AbBuild[]) {
    const source = path.resolve(baseDirectory, sources[build]);
    if (!fs.existsSync(path.join(source, 'home.html'))) {
      throw new Error(`No home.html in ${sources[build]}`);
    }
    const copy = copyAndStamp({ browser, source, baseDirectory, build });
    if (build === 'B' && injectHeadMs !== undefined) {
      const script = path.join(copy.target, getLastHomeScript(copy.target));
      const original = fs.readFileSync(script, 'utf8');
      fs.writeFileSync(script, getInjectionSnippet(injectHeadMs) + original);
    }
    directories[build] = copy.relative;
    manifestHashes[build] = copy.manifestHash;
    trees[build] = hashTree(copy.target);
    builds[build] = {
      source: sources[build],
      fileCount: trees[build].size,
      contentHash: digestOf(trees[build], ['manifest.json']),
      version: copy.version,
    };
  }

  // The manifests differ by their marker alone, so they are not counted.
  const names = new Set([...trees.A.keys(), ...trees.B.keys()]);
  names.delete('manifest.json');
  let differingFiles = 0;
  for (const name of names) {
    if (trees.A.get(name) !== trees.B.get(name)) {
      differingFiles += 1;
    }
  }

  return {
    browser,
    directories,
    manifestHashes,
    markerKey,
    builds,
    differingFiles,
  };
}
