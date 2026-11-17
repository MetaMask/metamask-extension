// Compares audit and lockfile before and after one cheap-path attempt; prints one result JSON.
// Usage: node audit-measure.mjs <label> <pkg|*> <before.ndjson> <after.ndjson> <before.lock> <after.lock> <up-exit> <up.log>
import { readFileSync } from 'node:fs';

const [label, pkg, beforeAudit, afterAudit, beforeLock, afterLock, upExit, upLog] =
  process.argv.slice(2);

const readAudit = (path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .map(({ value, children }) => ({ pkg: value, id: children.ID }));

// Map "descriptor list" header to version; one entry per resolution in yarn.lock.
const readLock = (path) => {
  const entries = new Map();
  for (const block of readFileSync(path, 'utf8').split(/\r?\n\r?\n/)) {
    const header = block.split(/\r?\n/).find((line) => line.endsWith(':') && !line.startsWith(' '));
    const version = /^ {2}version: (.+)$/m.exec(block)?.[1];
    if (header && version) {
      entries.set(header.replace(/^"|":?$/gu, ''), version);
    }
  }
  return entries;
};

const nameOf = (header) => /^(@?[^@]+)@/u.exec(header.split(', ')[0])?.[1] ?? header;

const before = readAudit(beforeAudit);
const after = readAudit(afterAudit);
const isTarget = (entry) => pkg === '*' || entry.pkg === pkg;
const targetBefore = before.filter(isTarget);
const targetAfter = after.filter(isTarget);
const beforeIds = new Set(before.map((entry) => entry.id));
const afterIds = new Set(after.map((entry) => entry.id));

const lockBefore = readLock(beforeLock);
const lockAfter = readLock(afterLock);
const changed = new Set();
for (const [header, version] of lockAfter) {
  if (lockBefore.get(header) !== version) {
    changed.add(nameOf(header));
  }
}
for (const header of lockBefore.keys()) {
  if (!lockAfter.has(header)) {
    changed.add(nameOf(header));
  }
}

const log = readFileSync(upLog, 'utf8');
let status = 'unchanged';
if (targetBefore.length > 0 && targetAfter.length === 0) {
  status = 'fixed';
} else if (targetAfter.length < targetBefore.length) {
  status = 'partial';
}
if (status !== 'fixed' && /YN0016/u.test(log)) {
  status = 'quarantined';
} else if (status === 'unchanged' && changed.size === 0 && upExit !== '0') {
  status = 'error';
}

process.stdout.write(
  JSON.stringify({
    label,
    status,
    targetBefore: targetBefore.length,
    targetAfter: targetAfter.length,
    totalBefore: before.length,
    totalAfter: after.length,
    otherFixed: [...beforeIds].filter((id) => !afterIds.has(id)).length - (targetBefore.length - targetAfter.length),
    newAdvisories: [...afterIds].filter((id) => !beforeIds.has(id)).length,
    lockEntriesChanged: changed.size,
    changedPackages: [...changed].sort().slice(0, 25),
    upExit,
    firstError: (log.split('\n').find((line) => /YN0(001|016|027|035)/u.test(line)) ?? '').slice(0, 240),
  }),
);
