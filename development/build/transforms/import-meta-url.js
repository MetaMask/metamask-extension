const { join } = require('node:path');

/**
 * @typedef {import('@babel/types').StringLiteral} StringLiteral
 * @typedef {import('@babel/types').TemplateLiteral} TemplateLiteral
 * @typedef {import('@babel/types').TemplateElement} TemplateElement
 * @typedef {import('@babel/types').Expression} Expression
 * @typedef {import('@babel/types').Types} Types
 * @typedef {import('@babel/core').PluginObj } PluginObj;
 * @typedef {import('@babel/core') } Babel;
 */

/**
 * @param {{types: import('@babel/types')}} babel
 * @returns {PluginObj}
 */
module.exports = function ({ types: t }) {
  /**
   * @type {PluginObj}
   */
  return {
    visitor: {
      NewExpression(path, state) {
        // Retrieve plugin options
        /**
         * @type {Array<string | RegExp>}
         */
        const patterns = state.opts.patterns || [];
        /**
         * @type {string}
         */
        const rootPathVar = state.opts.rootPathVar || '';

        // Validate that rootPathVar is provided
        if (!rootPathVar) {
          throw new Error('rootPathVar option is required');
        }

        // Check if the node is new URL(relativePath, import.meta.url)
        if (
          // new URL call with two args...
          path.node.callee.name === 'URL' &&
          path.node.arguments.length === 2 &&
          // and the first arg is a string or template literal
          (t.isStringLiteral(path.node.arguments[0]) || t.isTemplateLiteral(path.node.arguments[0])) &&
          // and the second arg is `import.meta.url`
          t.isMemberExpression(path.node.arguments[1]) &&
          t.isMetaProperty(path.node.arguments[1].object) &&
          path.node.arguments[1].object.meta.name === 'import' &&
          path.node.arguments[1].object.property.name === 'meta' &&
          path.node.arguments[1].property.name === 'url'
        ) {
          /**
           * @type {string}
           */
          let relativePath;
          if (t.isStringLiteral(path.node.arguments[0])) {
            relativePath = path.node.arguments[0].value;
          } else {
            relativePath = path.node.arguments[0].quasis.map(q => q.value.raw).join("___");
          }

          // Check if the relative path matches any user-defined patterns
          const matches = patterns.some((pattern) => {
            if (typeof pattern === 'string') {
              return relativePath === pattern;
            } else if (pattern instanceof RegExp) {
              return pattern.test(relativePath);
            }
            return false;
          });

          // Proceed with transformation if there's a match
          if (matches) {
            // Create the new argument: rootPathVar + transformedPath
            /**
             * @type {StringLiteral | TemplateLiteral}
             */
            let pathArg;
            if (t.isStringLiteral(path.node.arguments[0])) {
              pathArg = t.stringLiteral(join(rootPathVar, relativePath));
            } else {
              // we need to prepend the rootPathVar to the template literal
              /**
               * @type {Array<TemplateElement>}
               */
              const quasis = path.node.arguments[0].quasis;
              /**
               * @type {Array<Expression>}
               */
              const expressions = path.node.arguments[0].expressions;

              const newQuasis = [...quasis];

              // Prepend the string to the first quasi's raw/cooked text
              newQuasis[0] = t.templateElement({
                raw:    rootPathVar + quasis[0].value.raw,
                cooked: rootPathVar + quasis[0].value.cooked
              }, quasis[0].tail);

              const newExpressions = [...expressions];
              // create a new template literal
              pathArg = t.templateLiteral(newQuasis, newExpressions);
            }
            const baseArg = t.logicalExpression(
              '||',
              t.optionalMemberExpression(
                t.memberExpression(
                  t.identifier('self'),
                  t.identifier('document')
                ),
                t.identifier('baseURI'),
                false, // computed: false, since 'baseURI' is not a computed property (e.g., self.document['baseURI'])
                true   // optional: true, to enable the optional chaining operator (?.)
              ),
              t.memberExpression(
                t.memberExpression(
                  t.identifier('self'),
                  t.identifier('location'),
                ),
                t.identifier('href'),
              ),
            );

            // Create the new URL expression with one argument
            const newExpression = t.newExpression(t.identifier('URL'), [
              pathArg,
              baseArg,
            ]);

            // Replace the original expression
            path.replaceWith(newExpression);
          }
        }
      },
    },
  };
};
