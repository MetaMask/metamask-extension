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

// 'first', 'middle', 'last', or a zero-based index into home.html's scripts.
export type InjectionSite = string;

export type AbInjection = {
  file: string;
  site: InjectionSite;
  targetMs: number;
  hashes: Record<AbBuild, string>;
};

export type AbBuildsSummary = {
  browser: string;
  sourceDirectory: string;
  directories: Record<AbBuild, string>;
  fileCount: number;
  // Hash of every file except manifest.json and the injected file; equal for A and B.
  contentHash: string;
  manifestHashes: Record<AbBuild, string>;
  markerKey: string;
  injection?: AbInjection;
};

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
 * A script home.html loads. The last one is the UI entry point, so work there
 * runs once every script has loaded; work in the first script overlaps
 * Firefox's loading of the later ones.
 *
 * @param directory - Unpacked build.
 * @param site - Which script: first, middle, last or a zero-based index.
 */
export function getHomeScript(
  directory: string,
  site: InjectionSite = 'last',
): string {
  const html = fs.readFileSync(path.join(directory, 'home.html'), 'utf8');
  const sources = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/gu)];
  if (sources.length === 0) {
    throw new Error('No script found in home.html');
  }
  const named: Record<string, number> = {
    first: 0,
    middle: Math.floor((sources.length - 1) / 2),
    last: sources.length - 1,
  };
  const index = /^\d+$/u.test(site) ? Number(site) : named[site];
  if (index === undefined || index >= sources.length) {
    throw new Error(
      `Invalid injection site ${site} for ${sources.length} scripts`,
    );
  }
  return sources[index][1];
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

/**
 * Copies the donor build twice and stamps each copy with its own manifest
 * marker, then proves that nothing else differs. Throws on any other
 * difference so a pilot job never compares two builds that are not equivalent.
 *
 * @param options - Browser and the unpacked donor directory.
 * @param options.browser - `chrome` or `firefox`.
 * @param options.sourceDirectory - Unpacked donor build, for example `dist/chrome`.
 * @param options.baseDirectory - Working directory the output paths are under.
 * @param options.injectMs - When set, B's home.html script at `injectSite`
 * gets a busy-wait of this many milliseconds, and that file may also differ.
 * @param options.injectSite - Which script gets the busy-wait; default last.
 */
export function prepareAbBuilds({
  browser,
  sourceDirectory,
  baseDirectory = process.cwd(),
  injectMs,
  injectSite = 'last',
}: {
  browser: string;
  sourceDirectory: string;
  baseDirectory?: string;
  injectMs?: number;
  injectSite?: InjectionSite;
}): AbBuildsSummary {
  if (injectMs !== undefined && !(Number.isFinite(injectMs) && injectMs >= 0)) {
    throw new Error(`Invalid injection milliseconds ${injectMs}`);
  }
  const markerKey = getMarkerKey(browser);
  const source = path.resolve(baseDirectory, sourceDirectory);
  const directories = {} as Record<AbBuild, string>;
  const manifestHashes = {} as Record<AbBuild, string>;

  for (const build of ['A', 'B'] as AbBuild[]) {
    const copy = copyAndStamp({ browser, source, baseDirectory, build });
    directories[build] = copy.relative;
    manifestHashes[build] = copy.manifestHash;
  }

  const exclude = ['manifest.json'];
  let injection: AbInjection | undefined;
  if (injectMs !== undefined) {
    const file = getHomeScript(source, injectSite);
    const targetB = path.resolve(baseDirectory, directories.B, file);
    const original = fs.readFileSync(targetB, 'utf8');
    fs.writeFileSync(targetB, getInjectionSnippet(injectMs) + original);
    exclude.push(file);
    injection = {
      file,
      site: injectSite,
      targetMs: injectMs,
      hashes: {
        A: hashFile(path.resolve(baseDirectory, directories.A, file)),
        B: hashFile(targetB),
      },
    };
  }

  const treeA = hashTree(path.resolve(baseDirectory, directories.A));
  const treeB = hashTree(path.resolve(baseDirectory, directories.B));
  const contentHash = digestOf(treeA, exclude);
  if (
    contentHash !== digestOf(treeB, exclude) ||
    [...treeA.keys()].join('\n') !== [...treeB.keys()].join('\n')
  ) {
    throw new Error(`A/B builds differ outside ${exclude.join(', ')}`);
  }
  const manifestA = JSON.parse(
    fs.readFileSync(
      path.resolve(baseDirectory, directories.A, 'manifest.json'),
      'utf8',
    ),
  );
  const manifestB = JSON.parse(
    fs.readFileSync(
      path.resolve(baseDirectory, directories.B, 'manifest.json'),
      'utf8',
    ),
  );
  delete manifestA[markerKey];
  delete manifestB[markerKey];
  if (JSON.stringify(manifestA) !== JSON.stringify(manifestB)) {
    throw new Error(`A/B manifests differ beyond ${markerKey}`);
  }

  return {
    browser,
    sourceDirectory,
    directories,
    fileCount: treeA.size,
    contentHash,
    manifestHashes,
    markerKey,
    ...(injection && { injection }),
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
 */
export function preparePairBuilds({
  browser,
  baseSource,
  headSource,
  baseDirectory = process.cwd(),
}: {
  browser: string;
  baseSource: string;
  headSource: string;
  baseDirectory?: string;
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
