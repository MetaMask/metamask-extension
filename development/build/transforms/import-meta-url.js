const { join } = require('node:path');

module.exports = function (babel) {
  const { types: t } = babel;
  return {
    visitor: {
      NewExpression(path, state) {
        // Retrieve plugin options
        const patterns = state.opts.patterns || [];
        const rootPathVar = state.opts.rootPathVar || '';

        // Validate that rootPathVar is provided
        if (!rootPathVar) {
          throw new Error('rootPathVar option is required');
        }

        // Check if the node is new URL(relativePath, import.meta.url)
        if (
          path.node.callee.name === 'URL' &&
          path.node.arguments.length === 2 &&
          t.isStringLiteral(path.node.arguments[0]) &&
          t.isMemberExpression(path.node.arguments[1]) &&
          t.isMetaProperty(path.node.arguments[1].object) &&
          path.node.arguments[1].object.meta.name === 'import' &&
          path.node.arguments[1].object.property.name === 'meta' &&
          path.node.arguments[1].property.name === 'url'
        ) {
          const relativePath = path.node.arguments[0].value;

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
            const pathArg = t.stringLiteral(join(rootPathVar, relativePath));
            const baseArg = t.logicalExpression(
              '||',
              t.memberExpression(
                t.identifier('document'),
                t.identifier('baseURI'),
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
