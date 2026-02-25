/**
 * @fileoverview Enforce usage of FixtureBuilderV2 instead of legacy FixtureBuilder in E2E tests
 * @author MetaMask Team
 */

'use strict';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce usage of FixtureBuilderV2 instead of legacy FixtureBuilder in E2E tests',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      preferV2:
        'Use FixtureBuilderV2 instead of legacy FixtureBuilder. Import from "../../fixtures/fixture-builder-v2" for better type safety and modern fixture building. See https://consensyssoftware.atlassian.net/browse/MMQA-1462',
    },
    schema: [],
    fixable: null,
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;

        // Check if importing from fixture-builder (the legacy version)
        // This covers both relative imports like:
        // - '../../fixtures/fixture-builder'
        // - '../fixtures/fixture-builder'
        // - Any path ending with 'fixture-builder' but not 'fixture-builder-v2'
        if (
          typeof importSource === 'string' &&
          importSource.includes('fixture-builder') &&
          !importSource.includes('fixture-builder-v2')
        ) {
          // Check if the imported identifier is 'FixtureBuilder'
          const hasFixtureBuilderImport = node.specifiers.some(
            (specifier) =>
              (specifier.type === 'ImportDefaultSpecifier' ||
                specifier.type === 'ImportSpecifier') &&
              (specifier.local.name === 'FixtureBuilder' ||
                (specifier.imported &&
                  specifier.imported.name === 'FixtureBuilder')),
          );

          if (hasFixtureBuilderImport) {
            context.report({
              node,
              messageId: 'preferV2',
            });
          }
        }
      },

      // Also check for CommonJS require statements
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal'
        ) {
          const requireSource = node.arguments[0].value;

          if (
            typeof requireSource === 'string' &&
            requireSource.includes('fixture-builder') &&
            !requireSource.includes('fixture-builder-v2')
          ) {
            context.report({
              node,
              messageId: 'preferV2',
            });
          }
        }
      },
    };
  },
};
