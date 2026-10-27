import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  getBuildDirectory,
  getMarkerKey,
  getMarkerValue,
  type AbBuild,
} from './ab-pilot';

export type AbBuildsSummary = {
  browser: string;
  sourceDirectory: string;
  directories: Record<AbBuild, string>;
  fileCount: number;
  // Hash of every file except manifest.json; equal for A and B by construction.
  contentHash: string;
  manifestHashes: Record<AbBuild, string>;
  markerKey: string;
};

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
 * Hash of the relative paths and contents of every file except manifest.json.
 *
 * @param root - Directory to hash.
 */
function hashContent(root: string): { files: string[]; hash: string } {
  const files = listFiles(root);
  const hash = createHash('sha256');
  for (const file of files) {
    if (file !== 'manifest.json') {
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
 */
export function prepareAbBuilds({
  browser,
  sourceDirectory,
  baseDirectory = process.cwd(),
}: {
  browser: string;
  sourceDirectory: string;
  baseDirectory?: string;
}): AbBuildsSummary {
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

  const a = hashContent(path.resolve(baseDirectory, directories.A));
  const b = hashContent(path.resolve(baseDirectory, directories.B));
  if (a.hash !== b.hash || a.files.join('\n') !== b.files.join('\n')) {
    throw new Error('A/B builds differ outside manifest.json');
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
  };
}
