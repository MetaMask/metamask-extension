const { join } = require('node:path');

/**
 * @typedef {import('@babel/types').StringLiteral} StringLiteral
 * @typedef {import('@babel/types').TemplateLiteral} TemplateLiteral
 * @typedef {import('@babel/types').TemplateElement} TemplateElement
 * @typedef {import('@babel/types').Expression} Expression
 * @typedef {import('@babel/core').PluginObj} PluginObj
 * @typedef {import('@babel/core')} Babel
 */

/**
 * Babel plugin to transform `new URL(relativePath, import.meta.url)` expressions
 * when they match specified patterns.
 *
 * @param {{ types: import('@babel/types') }} babel - Babel types
 * @returns {PluginObj} The plugin object
 */
module.exports = function ({ types: t }) {
  /**
   * Checks if the node is a `new URL(relativePath, import.meta.url)` expression.
   *
   * @param {import('@babel/core').NodePath} path - The AST node path
   * @returns {boolean} True if it matches the target pattern
   */
  function isTargetNewURL(path) {
    const { node } = path;
    return (
      t.isNewExpression(node) &&
      t.isIdentifier(node.callee, { name: 'URL' }) &&
      node.arguments.length === 2 &&
      (t.isStringLiteral(node.arguments[0]) ||
        t.isTemplateLiteral(node.arguments[0])) &&
      t.isMemberExpression(node.arguments[1]) &&
      t.isMetaProperty(node.arguments[1].object) &&
      node.arguments[1].object.meta.name === 'import' &&
      node.arguments[1].object.property.name === 'meta' &&
      node.arguments[1].property.name === 'url'
    );
  }

  /**
   * Extracts the relative path from the first argument.
   * - For string literals: returns the value
   * - For template literals: joins quasis with '___'
   *
   * @param {StringLiteral | TemplateLiteral} arg - The first argument of new URL
   * @returns {string} The extracted relative path
   */
  function getRelativePath(arg) {
    if (t.isStringLiteral(arg)) {
      return arg.value;
    }
    return arg.quasis.map((q) => q.value.raw).join('___');
  }

  /**
   * Checks if the relative path matches the provided pattern.
   * - String pattern: exact match
   * - RegExp pattern: tests against the pattern
   *
   * @param {string} relativePath - The path to check
   * @param {string | RegExp} pattern - Pattern to match against
   * @returns {boolean} True if pattern matches
   */
  function matchesPattern(relativePath, pattern) {
    if (typeof pattern === 'string') {
      return relativePath === pattern;
    }
    if (pattern instanceof RegExp) {
      return pattern.test(relativePath);
    }
    return false;
  }

  /**
   * Builds the new path argument by prepending rootPath.
   * - String literals: uses path.join
   * - Template literals: prepends to first quasi
   *
   * @param {StringLiteral | TemplateLiteral} originalArg - Original path argument
   * @param {string} rootPath - Root path variable to prepend
   * @param {string | RegExp} pattern - Pattern to extract name from
   * @returns {StringLiteral | TemplateLiteral} New path argument
   */
  function buildNewPathArg(originalArg, rootPath, pattern) {
    if (t.isStringLiteral(originalArg)) {
      if (pattern instanceof RegExp) {
        const match = originalArg.value.match(pattern);
        if (match) {
          const filename = match[1];
          const ext = originalArg.value.split('.').slice(1).join('.');
          return t.stringLiteral(join(rootPath, `${filename}.${ext}`));
        }
      }
      return t.stringLiteral(join(rootPath, originalArg.value));
    }

    const quasis = [...originalArg.quasis];
    const expressions = [...originalArg.expressions];

    quasis[0] = t.templateElement(
      {
        raw: rootPath + quasis[0].value.raw,
        cooked: rootPath + quasis[0].value.cooked,
      },
      quasis[0].tail,
    );

    return t.templateLiteral(quasis, expressions);
  }

  /**
   * Builds the base argument: self.document?.baseURI || self.location.href
   * This aligns with the way webpack's built-in handling of `import.meta.url`.
   *
   * @returns {import('@babel/types').LogicalExpression} The base argument
   */
  function buildBaseArg() {
    return t.logicalExpression(
      '||',
      t.optionalMemberExpression(
        t.memberExpression(t.identifier('self'), t.identifier('document')),
        t.identifier('baseURI'),
        false,
        true,
      ),
      t.memberExpression(
        t.memberExpression(t.identifier('self'), t.identifier('location')),
        t.identifier('href'),
      ),
    );
  }

  /**
   * Creates the transformed `new URL` expression.
   *
   * @param {StringLiteral | TemplateLiteral} pathArg - New path argument
   * @param {import('@babel/types').LogicalExpression} baseArg - Base argument
   * @returns {import('@babel/types').NewExpression} Transformed expression
   */
  function buildNewExpression(pathArg, baseArg) {
    return t.newExpression(t.identifier('URL'), [pathArg, baseArg]);
  }

  return {
    visitor: {
      NewExpression(path, state) {
        // Get and validate options
        /**
         * @type {string | RegExp}
         */
        const pattern = state.opts.pattern || '';
        /**
         * @type {string}
         */
        const rootPath = state.opts.rootPath || '';

        if (!rootPath) {
          throw new Error('rootPath option is required');
        }

        // Check if it's our target expression
        if (!isTargetNewURL(path)) {
          return;
        }

        // Extract and check path
        const originalArg = path.node.arguments[0];
        const relativePath = getRelativePath(originalArg);

        // Transform if path matches pattern
        if (matchesPattern(relativePath, pattern)) {
          const pathArg = buildNewPathArg(originalArg, rootPath, pattern);
          const baseArg = buildBaseArg();
          const newExpression = buildNewExpression(pathArg, baseArg);
          path.replaceWith(newExpression);
        }
      },
    },
  };
};
