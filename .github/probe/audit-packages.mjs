// Lists packages with advisories from `yarn npm audit --json` output, as a JSON array for a matrix.
import { readFileSync } from 'node:fs';

// No patched release exists for these (plan 6.3), so trying them only adds noise.
const UNFIXABLE = new Set(['electron', 'extract-zip', 'bigint-buffer', 'deepmerge']);

const lines = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean);
const names = new Set();
for (const line of lines) {
  const { value } = JSON.parse(line);
  if (!UNFIXABLE.has(value)) {
    names.add(value);
  }
}
process.stdout.write(JSON.stringify([...names].sort()));
