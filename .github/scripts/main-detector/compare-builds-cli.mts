/**
 * Usage: node .github/scripts/main-detector/compare-builds-cli.mts --resolve resolve.json --out compare.json
 * Decides whether the head and base builds hold the same files, by reading
 * only each zip's central directory with HTTP range requests (no downloads).
 * Any failure counts as "not identical", so the detector measures instead.
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { buildZipUrl } from './build-source.mts';
import { BROWSERS } from './score.mts';
import {
  fingerprint,
  inflateEntry,
  LOCAL_HEADER_SIZE,
  localDataOffset,
  locateCentralDirectory,
  normalizeManifest,
  parseCentralDirectory,
  TAIL_BYTES,
  type ZipEntry,
} from './zip-fingerprint.mts';

async function range(url: string, spec: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { Range: `bytes=${spec}` } });
  if (response.status !== 206) {
    throw new Error(`${url}: expected 206, got ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function manifestOf(url: string, entries: ZipEntry[]): Promise<string> {
  const entry = entries.find((e) => e.name === 'manifest.json');
  if (!entry) {
    throw new Error(`${url}: no manifest.json`);
  }
  const header = await range(
    url,
    `${entry.offset}-${entry.offset + LOCAL_HEADER_SIZE - 1}`,
  );
  const start = entry.offset + localDataOffset(header);
  const data = await range(url, `${start}-${start + entry.compressedSize - 1}`);
  return normalizeManifest(inflateEntry(data, entry.method).toString('utf8'));
}

async function zipFingerprint(url: string): Promise<string> {
  const tail = await range(url, `-${TAIL_BYTES}`);
  const location = locateCentralDirectory(tail);
  if (!location) {
    throw new Error(`${url}: no usable end record`);
  }
  const directory = await range(
    url,
    `${location.offset}-${location.offset + location.size - 1}`,
  );
  const entries = parseCentralDirectory(directory, location.entries);
  return fingerprint(entries, await manifestOf(url, entries));
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { resolve: { type: 'string' }, out: { type: 'string' } },
  });
  if (!values.resolve || !values.out) {
    throw new Error('--resolve and --out are required');
  }
  const { out } = values;
  const resolved = JSON.parse(fs.readFileSync(values.resolve, 'utf8'));

  const result: Record<string, unknown> = { identical: false };
  const baseRef = resolved.base;
  const headRef = resolved.head;
  // Equal source hashes, or the same donor run, are what main.yml trusts to
  // reuse one build for both commits, so no zip needs reading.
  if (
    baseRef.run === headRef.run ||
    (baseRef.sourceHash && baseRef.sourceHash === headRef.sourceHash)
  ) {
    result.identical = true;
    result.via = baseRef.run === headRef.run ? 'same-run' : 'source-hash';
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    return;
  }
  try {
    const same: boolean[] = [];
    for (const browser of BROWSERS) {
      const [base, head] = await Promise.all([
        zipFingerprint(buildZipUrl(browser, baseRef.run, baseRef.version)),
        zipFingerprint(buildZipUrl(browser, headRef.run, headRef.version)),
      ]);
      result[browser] = { base, head };
      same.push(base === head);
    }
    result.identical = same.every(Boolean);
  } catch (error) {
    result.error = String(error);
  }
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
