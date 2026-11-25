import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  isParsedAdvisory,
  readAdvisories,
  type ParsedAdvisory,
} from './audit-utils.mts';

const VALID_ADVISORY: ParsedAdvisory = {
  id: 1234,
  moduleName: 'example-package',
  title: 'Prototype pollution in example-package',
  url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
  vulnerableVersions: '<1.2.3',
  patchedVersions: '>=1.2.3',
  originalSeverity: 'high',
  effectiveSeverity: 'high',
  isDevOnly: false,
  affectsProduction: true,
  matchedIssueRule: 'none',
  treeVersions: ['1.0.0'],
  dependents: ['root@workspace:.'],
};

describe('isParsedAdvisory', () => {
  it('accepts a complete advisory', () => {
    expect(isParsedAdvisory(VALID_ADVISORY)).toBe(true);
  });

  it('accepts an advisory with a null id', () => {
    expect(isParsedAdvisory({ ...VALID_ADVISORY, id: null })).toBe(true);
  });

  it('accepts an advisory missing fields that diffing does not use', () => {
    const minimal: Partial<ParsedAdvisory> = { ...VALID_ADVISORY };
    delete minimal.treeVersions;
    delete minimal.dependents;
    delete minimal.matchedIssueRule;
    expect(isParsedAdvisory(minimal)).toBe(true);
  });

  it('rejects non-object values', () => {
    expect(isParsedAdvisory(null)).toBe(false);
    expect(isParsedAdvisory('advisory')).toBe(false);
    expect(isParsedAdvisory(42)).toBe(false);
    expect(isParsedAdvisory([VALID_ADVISORY])).toBe(false);
  });

  it('rejects an advisory with a missing identity field', () => {
    const withoutModuleName: Partial<ParsedAdvisory> = { ...VALID_ADVISORY };
    delete withoutModuleName.moduleName;
    expect(isParsedAdvisory(withoutModuleName)).toBe(false);
  });

  it('rejects an advisory with an unknown severity', () => {
    expect(
      isParsedAdvisory({ ...VALID_ADVISORY, effectiveSeverity: 'severe' }),
    ).toBe(false);
  });

  it('rejects an advisory with a non-boolean affectsProduction', () => {
    expect(
      isParsedAdvisory({ ...VALID_ADVISORY, affectsProduction: 'true' }),
    ).toBe(false);
  });
});

describe('readAdvisories', () => {
  let dir: string;
  let filePath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'audit-utils-test-'));
    filePath = join(dir, 'advisories.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns the advisories from a valid file', () => {
    writeFileSync(filePath, JSON.stringify([VALID_ADVISORY]));
    expect(readAdvisories(filePath)).toStrictEqual([VALID_ADVISORY]);
  });

  it('returns an empty list for an empty file or an empty array', () => {
    writeFileSync(filePath, '');
    expect(readAdvisories(filePath)).toStrictEqual([]);
    writeFileSync(filePath, '[]');
    expect(readAdvisories(filePath)).toStrictEqual([]);
  });

  it('returns null when the file does not exist', () => {
    expect(readAdvisories(join(dir, 'missing.json'))).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    writeFileSync(filePath, '{not json');
    expect(readAdvisories(filePath)).toBeNull();
  });

  it('returns null for valid JSON that is not an array', () => {
    writeFileSync(filePath, JSON.stringify({ advisories: [VALID_ADVISORY] }));
    expect(readAdvisories(filePath)).toBeNull();
  });

  it('returns null when any entry is not a valid advisory', () => {
    writeFileSync(filePath, JSON.stringify([VALID_ADVISORY, { id: 1 }]));
    expect(readAdvisories(filePath)).toBeNull();
  });
});
