module.exports = {
  meta: {
    type: 'suggestion',
    messages: {
      found:
        `"{{ name }}" may be an example of the getText() anti-pattern, see https://github.com/MetaMask/metamask-extension/issues/19870` +
        `\n\tIf you're sure it's okay, please eslint-disable-next-line with a reason`,
      fixable:
        `"{{ name }}" may be an example of the getText() anti-pattern, see https://github.com/MetaMask/metamask-extension/issues/19870` +
        `\n\tThis one is automatically fixable, so run "yarn eslint:fix"`,
    },
    schema: [],
    fixable: 'code',
  },
  create(context) {
    return {
      Identifier: (node) => {
        // Get all nodes with the name getText
        if (node.name === 'getText') {
          const regexWorked = regexFixer(context, node);

          if (!regexWorked) {
            astMethod(context, node);
          }
        }
      },
    };
  },
};

/**
 * This regex searches for something in the form of:
 *
 * const $1 = await driver.findElement($2);
 * assert.equal(await $3.getText(), $4);
 */
const reFinder =
  /const (\S*) = (?:await )?driver.findElement\(\s*('[^\n]*?'),?\s*\);\s*assert.equal\((?:await )?(\w*).getText\(\), (\w*)\);/su;

const reReplacer = 'await driver.findElement({ css: $2, text: $4})';

function regexFixer(context, node) {
  // (in ESLint 9 this will be `context.sourceCode`)
  const code = context.getSourceCode();

  // Get the scope of this getText() call
  // (in ESLint 9 this will be `code.getScope(node)`)
  const scope = context.getScope(node);

  const text = code.getText(scope.block);

  if (text.match(reFinder)) {
    const newText = text.replace(reFinder, reReplacer);

    context.report({
      node,
      messageId: 'fixable',
      data: {
        name: node.parent.object.name,
      },
      fix(fixer) {
        return fixer.replaceText(scope.block, newText);
      },
    });

    return true;
  }

  return false;
}

// This is still a work in progress
function astMethod(context, node) {
  // (in ESLint 9 this will be `context.sourceCode`)
  const code = context.getSourceCode();

  // Get the scope of this getText() call
  // (in ESLint 9 this will be `code.getScope(node)`)
  const scope = context.getScope(node);

  // Get the variable that getText() was called on
  const calledOn = node.parent.object;

  // Get the definition of that variable
  const variable = scope.variables.find((v) => v.name === calledOn.name);

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
