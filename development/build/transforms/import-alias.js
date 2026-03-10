const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

/**
 * Mapping of import alias prefixes to directories (relative to project root).
 * Add new aliases here to make them available across the codebase.
 */
const ALIASES = {
  '~/ui': 'ui',
  '~/shared': 'shared',
};

/**
 * If `importSource` starts with a known alias, return the equivalent
 * relative path from `filename`'s directory. Otherwise return null.
 *
 * @param {string} importSource - e.g. '~/shared/constants/network'
 * @param {string} filename - absolute path of the file being compiled
 * @returns {string | null} rewritten relative path or null
 */
function rewriteAlias(importSource, filename) {
  for (const [alias, directory] of Object.entries(ALIASES)) {
    if (importSource !== alias && !importSource.startsWith(`${alias}/`)) {
      continue;
    }

    const rest = importSource.slice(alias.length);
    const absoluteTarget = path.join(ROOT, directory, rest);
    let relativePath = path
      .relative(path.dirname(filename), absoluteTarget)
      .split(path.sep)
      .join('/');

    if (!relativePath.startsWith('.')) {
      relativePath = `./${relativePath}`;
    }

    return relativePath;
  }

  return null;
}

/**
 * Babel plugin that rewrites `~/ui/...` and `~/shared/...` import aliases
 * to relative paths. This allows browserify (which has no native alias
 * support) to resolve them using standard Node module resolution.
 *
 * @returns {import('@babel/core').PluginObj} Babel plugin object
 */
module.exports = function importAliasPlugin() {
  return {
    visitor: {
      // import X from '~/shared/...'
      // export { X } from '~/shared/...'
      // export * from '~/shared/...'
      'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'(
        nodePath,
        state,
      ) {
        const { source } = nodePath.node;
        if (!source) {
          return;
        }

        const rewritten = rewriteAlias(source.value, state.filename);
        if (rewritten) {
          source.value = rewritten;
        }
      },

      // require('~/shared/...')
      CallExpression(nodePath, state) {
        const { callee } = nodePath.node;
        const arg = nodePath.node.arguments[0];

        if (
          callee.type !== 'Identifier' ||
          callee.name !== 'require' ||
          !arg ||
          arg.type !== 'StringLiteral'
        ) {
          return;
        }

        const rewritten = rewriteAlias(arg.value, state.filename);
        if (rewritten) {
          arg.value = rewritten;
        }
      },
    },
  };
};

module.exports.rewriteAlias = rewriteAlias;
module.exports.ALIASES = ALIASES;
