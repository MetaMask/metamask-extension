/**
 * Usage: yarn tsx test/e2e/benchmarks/main-detector/compare-builds-cli.ts --resolve resolve.json --out compare.json
 * Decides whether the head and base builds hold the same files, by reading
 * only each zip's central directory with HTTP range requests (no downloads).
 * Any failure counts as "not identical", so the detector measures instead.
 */
import fs from 'fs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import {
  fingerprint,
  locateCentralDirectory,
  parseCentralDirectory,
  TAIL_BYTES,
} from './zip-fingerprint';

const HOST =
  process.env.DETECTOR_BUILD_HOST ??
  'https://diuv6g5fj9pvx.cloudfront.net/metamask-extension';

async function range(url: string, spec: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { Range: `bytes=${spec}` } });
  if (response.status !== 206) {
    throw new Error(`${url}: expected 206, got ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
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
  return fingerprint(parseCentralDirectory(directory, location.entries));
}

type Side = { run: string; version: string };

function urlFor(browser: string, side: Side): string {
  const folder =
    browser === 'firefox' ? 'build-test-mv2-webpack' : 'build-test-webpack';
  return `${HOST}/${side.run}/${folder}/builds/metamask-${browser}-${side.version}.zip`;
}

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('resolve', { type: 'string', demandOption: true })
    .option('out', { type: 'string', demandOption: true })
    .parseAsync();
  const resolved = JSON.parse(fs.readFileSync(argv.resolve, 'utf8'));

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
    fs.writeFileSync(argv.out, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    return;
  }
  try {
    const same: boolean[] = [];
    for (const browser of ['chrome', 'firefox']) {
      const [base, head] = await Promise.all([
        zipFingerprint(urlFor(browser, resolved.base)),
        zipFingerprint(urlFor(browser, resolved.head)),
      ]);
      result[browser] = { base, head };
      same.push(base === head);
    }
    result.identical = same.every(Boolean);
  } catch (error) {
    result.error = String(error);
  }
  fs.writeFileSync(argv.out, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
