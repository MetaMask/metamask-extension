/**
 * Picks the head build and its base for the main-commit performance detector.
 * The base is the nearest first-parent ancestor of the head that has a build;
 * when commits between them have none, the result is a range, not one commit.
 */

export type BuildRef = {
  sha: string;
  // main.yml run that uploaded the build zips to CloudFront.
  run: string;
  // Extension version in package.json at that commit, which names the zips.
  version: string;
  // main.yml's `build-source-hash` status for the commit: equal hashes mean
  // the same build inputs, which main.yml itself treats as reusable builds.
  sourceHash?: string;
};

export type ResolveResult =
  | {
      status: 'measure';
      head: BuildRef;
      base: BuildRef;
      // Commits after the base, up to and including the head, newest first.
      range: string[];
    }
  | { status: 'no-build'; headSha: string }
  | { status: 'no-base'; head: BuildRef; checked: number };

export type BuildLookup = (sha: string) => Promise<BuildRef | undefined>;

/**
 * @param commits - First-parent history, head first.
 * @param lookup - Finds the build of one commit, if any.
 */
export async function resolveBuilds(
  commits: string[],
  lookup: BuildLookup,
): Promise<ResolveResult> {
  const [headSha, ...ancestors] = commits;
  const head = await lookup(headSha);
  if (!head) {
    return { status: 'no-build', headSha };
  }
  for (const [position, sha] of ancestors.entries()) {
    const base = await lookup(sha);
    if (base) {
      return {
        status: 'measure',
        head,
        base,
        range: commits.slice(0, position + 1),
      };
    }
  }
  return { status: 'no-base', head, checked: ancestors.length };
}

/**
 * Latest value per context from `context<TAB>description` lines, newest first
 * as the commit statuses API lists them.
 *
 * @param text - Lines printed by `gh api --paginate` with a `@tsv` jq filter.
 */
export function parseStatusLines(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split('\n').filter(Boolean)) {
    const [context, description = ''] = line.split('\t');
    result[context] ??= description;
  }
  return result;
}
