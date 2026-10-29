import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  getBuildDirectory,
  getMarkerKey,
  getMarkerValue,
  type AbBuild,
} from './ab-pilot';

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
 * Hash of the relative paths and contents of every file not in `exclude`.
 *
 * @param root - Directory to hash.
 * @param exclude
 */
function hashContent(
  root: string,
  exclude: string[],
): { files: string[]; hash: string } {
  const files = listFiles(root);
  const hash = createHash('sha256');
  for (const file of files) {
    if (!exclude.includes(file)) {
      hash.update(
        `${file.split(path.sep).join('/')}\0${hashFile(path.join(root, file))}\n`,
      );
    }
  }
  return { files, hash: hash.digest('hex') };
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
  const manifest = JSON.parse(
    fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'),
  );
  const builds: AbBuild[] = ['A', 'B'];
  const directories = {} as Record<AbBuild, string>;
  const manifestHashes = {} as Record<AbBuild, string>;

  for (const build of builds) {
    const relative = getBuildDirectory(browser, build);
    const target = path.resolve(baseDirectory, relative);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(source, target, { recursive: true });
    const stamped = { ...manifest, [markerKey]: getMarkerValue(build) };
    const text = JSON.stringify(stamped, null, 2);
    fs.writeFileSync(path.join(target, 'manifest.json'), text);
    directories[build] = relative;
    manifestHashes[build] = createHash('sha256').update(text).digest('hex');
  }

  const exclude = ['manifest.json'];
  let injection: AbInjection | undefined;
  if (injectMs !== undefined) {
    const file = getHomeScript(source, injectSite);
    const targetB = path.resolve(baseDirectory, directories.B, file);
    const original = fs.readFileSync(targetB, 'utf8');
    fs.writeFileSync(targetB, getInjectionSnippet(injectMs) + original);
    exclude.push(path.normalize(file));
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

  const a = hashContent(path.resolve(baseDirectory, directories.A), exclude);
  const b = hashContent(path.resolve(baseDirectory, directories.B), exclude);
  if (a.hash !== b.hash || a.files.join('\n') !== b.files.join('\n')) {
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
    fileCount: a.files.length,
    contentHash: a.hash,
    manifestHashes,
    markerKey,
    ...(injection && { injection }),
  };
}
