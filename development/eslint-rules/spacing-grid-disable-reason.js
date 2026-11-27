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
        // `getDisableDirectives()` parses comments the same way ESLint does
        // when it applies them, so the rule list and the reason always match.
        // `eslint-enable` is left alone: it restores rules, it does not hide a
        // violation.
        const { directives } = sourceCode.getDisableDirectives();
        for (const directive of directives) {
          if (directive.type === 'enable') {
            continue;
          }
          const namesSpacingGrid = directive.value
            .split(',')
            .some((entry) => entry.trim() === RULE_NAME);
          if (namesSpacingGrid && directive.justification.trim() === '') {
            context.report({
              node: directive.node,
              messageId: 'missingReason',
            });
          }
        }
      },
    };
  },
};
