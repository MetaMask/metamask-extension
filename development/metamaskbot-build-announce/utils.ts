/**
 * Cross-cutting utilities for the PR announcement comment builder.
 */

/**
 * Runs a section builder and returns its result, or a "data not available"
 * message for `sectionName` if the builder returns null/undefined/'' or throws.
 *
 * @param fn - Async builder function.
 * @param sectionName - Human-readable section name used in the fallback message.
 * @returns Resolved HTML or the fallback message.
 */
export function buildSectionWithFallback(
  fn: () => Promise<string | null | undefined>,
  sectionName: string,
): Promise<string> {
  const fallback = `<p><i>${sectionName}: data not available.</i></p>\n\n`;
  return fn()
    .then((result) => result || fallback)
    .catch((error: unknown) => {
      console.log(
        `No data available for ${sectionName}; skipping (${String(error)})`,
      );
      return fallback;
    });
}

/**
 * Uses Github API to post a comment to a PR with `metamaskbot`.
 *
 * @param param - Params object.
 * @param param.commentBody - Comment to post.
 * @param param.owner - Github repo owner.
 * @param param.repository - Github repository.
 * @param param.prNumber - PR Number.
 * @param [param.optionalLog] - Optional log for extra debug.
 * @param [param.commentToken] - PR secret comment token.
 * @returns A promise with response object or null.
 */
export async function postCommentWithMetamaskBot({
  commentBody,
  owner,
  repository,
  prNumber,
  optionalLog,
  commentToken,
}: {
  commentBody: string;
  owner: string;
  repository: string;
  prNumber: string;
  optionalLog?: string;
  commentToken?: string;
}): Promise<Response | null> {
  const JSON_PAYLOAD = JSON.stringify({ body: commentBody });
  const POST_COMMENT_URI = `https://api.github.com/repos/${owner}/${repository}/issues/${prNumber}/comments`;

  if (optionalLog) {
    console.log(optionalLog);
  }

  if (!commentToken) {
    return null;
  }

  console.log(`Posting to: ${POST_COMMENT_URI}`);

  const response = await fetch(POST_COMMENT_URI, {
    method: 'POST',
    body: JSON_PAYLOAD,
    headers: {
      'User-Agent': 'metamaskbot',
      Authorization: `token ${commentToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Post comment failed with status '${response.statusText}': ${errorText}`,
    );
  }

  return response;
}
