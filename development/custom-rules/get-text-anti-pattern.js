// get-text-anti-pattern.js

module.exports = {
  meta: {
    type: 'suggestion',
    messages: {
      found:
        `"{{ name }}" may be an example of the getText() anti-pattern, see https://github.com/MetaMask/metamask-extension/issues/19870` +
        `\n\tIf you're sure it's okay, please eslint-disable-next-line with a reason`,
    },
    schema: [],
  },
  create(context) {
    return {
      Identifier: (node) => {
        // Get all nodes with the name getText
        if (node.name === 'getText') {
          // (in ESLint 9 this will be `context.sourceCode`)
          const code = context.getSourceCode();

          // Get the scope of this getText() call
          // (in ESLint 9 this will be `code.getScope(node)`)
          const scope = context.getScope(node);

          // Get the variable that getText() was called on
          const calledOn = node.parent.object;

          // Get the definition of that variable
          const variable = scope.variables.find(
            (v) => v.name === calledOn.name,
          );

          // If we find the variable
          if (variable) {
            // Get the full text of that variable declaration
            const declaration = code.getText(variable.defs[0].node);

            // If the declaration includes the word "driver", report it
            if (declaration.includes('driver')) {
              context.report({
                node,
                messageId: 'found',
                data: {
                  name: node.parent.object.name,
                },
              });
            }
          }
        }
      },
    };
  },
};
