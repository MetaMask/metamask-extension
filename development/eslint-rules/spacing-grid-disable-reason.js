'use strict';

/**
 * Custom ESLint rule: require a reason on `eslint-disable` directives that
 * name `design-system/spacing-grid`.
 *
 * The usual `eslint-comments/require-description` rule asks for a description
 * on every directive in a file, and it is not a dependency of this repo. This
 * rule only fires on directives for the spacing-grid rule, so a 2px half-step
 * or an optical offset still needs `-- <why>` on its disable comment.
 */

const RULE_NAME = 'design-system/spacing-grid';

/**
 * `eslint-disable`, `eslint-disable-line` and `eslint-disable-next-line`.
 * `eslint-enable` is left alone: it restores rules, it does not hide a
 * violation.
 */
const DIRECTIVE_PATTERN = /^eslint-disable(?:-line|-next-line)?\b/u;

/**
 * The description separator, matching how ESLint splits directive comments
 * (two or more dashes surrounded by whitespace, on the untrimmed comment
 * text; see `@eslint/plugin-kit`'s comment parser).
 */
const SEPARATOR_PATTERN = /\s-{2,}\s/u;

/**
 * Check whether a directive's rule list names the spacing-grid rule.
 *
 * @param {string} ruleList - The directive's comma-separated rule list, with
 * any inline options still attached.
 * @returns {boolean} Whether the list names `design-system/spacing-grid`.
 */
function namesSpacingGrid(ruleList) {
  return ruleList.split(',').some((entry) => {
    // Rule entries may carry inline options or quotes, e.g.
    // `rule[foo=bar]` or `'rule'`.
    const name = entry
      .trim()
      .replace(/\[.*$/u, '')
      .replace(/^['"](.*)['"]$/u, '$1');
    return name === RULE_NAME;
  });
}

/**
 * Check whether a comment is a disable directive for the spacing-grid rule
 * that does not carry a reason.
 *
 * @param {import('estree').Comment} comment - The comment to check.
 * @returns {boolean} Whether the comment needs a reason.
 */
function missesReason(comment) {
  const { value } = comment;
  const separator = SEPARATOR_PATTERN.exec(value);
  const directivePart = (
    separator ? value.slice(0, separator.index) : value
  ).trim();
  const labelMatch = DIRECTIVE_PATTERN.exec(directivePart);
  if (!labelMatch) {
    return false;
  }
  const ruleList = directivePart.slice(labelMatch[0].length);
  if (!namesSpacingGrid(ruleList)) {
    return false;
  }
  const reason = separator
    ? value.slice(separator.index + separator[0].length).trim()
    : '';
  return reason.length === 0;
}

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: `Require a reason on eslint-disable directives for ${RULE_NAME}`,
    },
    schema: [],
    messages: {
      missingReason: `Disable directives for ${RULE_NAME} require a reason. Add "-- <reason>" to the comment, or fix the spacing instead.`,
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (missesReason(comment)) {
            context.report({ node: comment, messageId: 'missingReason' });
          }
        }
      },
    };
  },
};
