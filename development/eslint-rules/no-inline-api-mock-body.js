'use strict';

/**
 * Flags inline object and array literals used as mockttp response bodies in
 * E2E tests. Response bodies belong in `test/e2e/mock-response-data/api-responses/`,
 * with the fixture id recorded in `sources.json`.
 *
 * `withJsonBody` is a request matcher, not a response, so it is not flagged.
 */

const RESPONSE_METHODS = new Set(['thenJson', 'thenCallback']);

/**
 * @param {import('estree').Node | null | undefined} node
 * @returns {import('estree').Node | null | undefined}
 */
function unwrap(node) {
  let current = node;
  while (
    current &&
    (current.type === 'ChainExpression' ||
      current.type === 'ParenthesizedExpression' ||
      current.type === 'TSAsExpression' ||
      current.type === 'TSSatisfiesExpression' ||
      current.type === 'TSNonNullExpression' ||
      current.type === 'TSTypeAssertion')
  ) {
    current = current.expression;
  }
  return current;
}

/**
 * @param {import('estree').Node | null | undefined} node
 * @returns {boolean}
 */
function isLiteralBody(node) {
  const value = unwrap(node);
  return (
    value?.type === 'ObjectExpression' || value?.type === 'ArrayExpression'
  );
}

/**
 * @param {import('estree').CallExpression} node
 * @returns {string | null}
 */
function methodName(node) {
  const { callee } = node;
  if (callee.type !== 'MemberExpression' || callee.computed) {
    return null;
  }
  return callee.property.type === 'Identifier' ? callee.property.name : null;
}

/**
 * @param {import('estree').Property | import('estree').SpreadElement} property
 * @returns {string | null}
 */
function propertyName(property) {
  if (property.type !== 'Property' || property.computed) {
    return null;
  }
  const { key } = property;
  if (key.type === 'Identifier') {
    return key.name;
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow inline object and array literals as E2E API mock response bodies',
    },
    schema: [],
    messages: {
      inlineBody:
        'Use a fixture from test/e2e/mock-response-data/api-responses/ instead of an inline response body. Add the fixture id to api-responses/sources.json.',
    },
  },
  create(context) {
    /**
     * @param {import('estree').Node | null | undefined} node
     */
    function reportLiteralBodies(node) {
      const value = unwrap(node);
      if (!value) {
        return;
      }
      if (isLiteralBody(value)) {
        context.report({ node: value, messageId: 'inlineBody' });
        return;
      }
      if (value.type === 'ConditionalExpression') {
        reportLiteralBodies(value.consequent);
        reportLiteralBodies(value.alternate);
        return;
      }
      if (value.type === 'LogicalExpression') {
        reportLiteralBodies(value.left);
        reportLiteralBodies(value.right);
      }
    }

    /**
     * @param {import('estree').Node | null | undefined} node
     */
    function reportJsonProperties(node) {
      const value = unwrap(node);
      if (!value) {
        return;
      }
      if (value.type === 'ObjectExpression') {
        for (const property of value.properties) {
          if (propertyName(property) === 'json') {
            reportLiteralBodies(property.value);
          }
        }
        return;
      }
      if (value.type === 'ConditionalExpression') {
        reportJsonProperties(value.consequent);
        reportJsonProperties(value.alternate);
        return;
      }
      if (value.type === 'LogicalExpression') {
        reportJsonProperties(value.left);
        reportJsonProperties(value.right);
      }
    }

    /**
     * Walks the callback's own statements. Nested functions are left alone,
     * so a helper declared inside the callback is not treated as the response.
     *
     * @param {import('estree').Node | null | undefined} node
     */
    function walkCallback(node) {
      if (!node) {
        return;
      }
      switch (node.type) {
        case 'BlockStatement':
          node.body.forEach(walkCallback);
          return;
        case 'ReturnStatement':
          reportJsonProperties(node.argument);
          return;
        case 'IfStatement':
          walkCallback(node.consequent);
          walkCallback(node.alternate);
          return;
        case 'SwitchStatement':
          node.cases.forEach((switchCase) => {
            switchCase.consequent.forEach(walkCallback);
          });
          return;
        case 'TryStatement':
          walkCallback(node.block);
          walkCallback(node.handler?.body);
          walkCallback(node.finalizer);
          return;
        case 'VariableDeclaration':
          for (const declarator of node.declarations) {
            if (
              declarator.id.type === 'Identifier' &&
              declarator.id.name === 'json'
            ) {
              reportLiteralBodies(declarator.init);
            }
          }
          break;
        default:
          break;
      }
    }

    return {
      CallExpression(node) {
        const name = methodName(node);
        if (!RESPONSE_METHODS.has(name)) {
          return;
        }
        if (name === 'thenJson') {
          const body =
            node.arguments.length >= 2 ? node.arguments[1] : node.arguments[0];
          reportLiteralBodies(body);
          return;
        }
        const callback = unwrap(node.arguments[0]);
        if (
          !callback ||
          (callback.type !== 'ArrowFunctionExpression' &&
            callback.type !== 'FunctionExpression')
        ) {
          return;
        }
        if (callback.body.type === 'BlockStatement') {
          walkCallback(callback.body);
          return;
        }
        reportJsonProperties(callback.body);
      },
    };
  },
};
