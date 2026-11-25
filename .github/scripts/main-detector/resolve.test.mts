import {
  parseStatusLines,
  resolveBuilds,
  resolveBuildsAgainst,
  type BuildLookup,
  type BuildRef,
} from './resolve.mts';

const build = (sha: string): BuildRef => ({
  sha,
  run: `run-${sha}`,
  version: '13.59.0',
});

const lookupOf =
  (withBuild: string[]): BuildLookup =>
  async (sha) =>
    withBuild.includes(sha) ? build(sha) : undefined;

describe('resolveBuildsAgainst', () => {
  const history = ['e', 'd', 'c', 'b', 'a'];

  it('measures the range back to the named base, skipping nearer builds', async () => {
    const result = await resolveBuildsAgainst(history, 'b', lookupOf(history));
    expect(result).toStrictEqual({
      status: 'measure',
      head: build('e'),
      base: build('b'),
      range: ['e', 'd', 'c'],
    });
  });

  it('has nothing to measure when the base is the head', async () => {
    expect(
      await resolveBuildsAgainst(history, 'e', lookupOf(history)),
    ).toStrictEqual({ status: 'unchanged', head: build('e') });
  });

  it('reports no base when the named commit is outside the history or has no build', async () => {
    expect(
      await resolveBuildsAgainst(history, 'z', lookupOf(history)),
    ).toMatchObject({ status: 'no-base', checked: 4 });
    expect(
      await resolveBuildsAgainst(history, 'b', lookupOf(['e', 'a'])),
    ).toMatchObject({ status: 'no-base' });
  });

  it('cannot measure a head without a build', async () => {
    expect(
      await resolveBuildsAgainst(history, 'b', lookupOf(['b'])),
    ).toStrictEqual({ status: 'no-build', headSha: 'e' });
  });
});

describe('resolveBuilds', () => {
  it('pairs the head with its parent when both have builds', async () => {
    const result = await resolveBuilds(
      ['c', 'b', 'a'],
      lookupOf(['c', 'b', 'a']),
    );
    expect(result).toStrictEqual({
      status: 'measure',
      head: build('c'),
      base: build('b'),
      range: ['c'],
    });
  });

  it('reports the range when commits in between have no build', async () => {
    const result = await resolveBuilds(
      ['d', 'c', 'b', 'a'],
      lookupOf(['d', 'a']),
    );
    expect(result).toStrictEqual({
      status: 'measure',
      head: build('d'),
      base: build('a'),
      range: ['d', 'c', 'b'],
    });
  });

  it('cannot measure a head without a build', async () => {
    expect(await resolveBuilds(['c', 'b'], lookupOf(['b']))).toStrictEqual({
      status: 'no-build',
      headSha: 'c',
    });
  });

  it('cannot measure when no ancestor has a build', async () => {
    expect(await resolveBuilds(['c', 'b', 'a'], lookupOf(['c']))).toStrictEqual(
      {
        status: 'no-base',
        head: build('c'),
        checked: 2,
      },
    );
  });
});

describe('parseStatusLines', () => {
  it('keeps the newest status of each context', () => {
    const text =
      'builds-from-run\t222\nbuild-source-hash\tabc\nbuilds-from-run\t111\n';
    expect(parseStatusLines(text)).toStrictEqual({
      'builds-from-run': '222',
      'build-source-hash': 'abc',
    });
  });

  it('returns nothing for no statuses', () => {
    expect(parseStatusLines('')).toStrictEqual({});
  });
});
