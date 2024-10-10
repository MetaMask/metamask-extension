/**
 * This is really just an example of how to write a custom rule, and probably will be deleted later.
 */

import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'illegalFunctionFound';

type Options = [
  {
    illegalFunctionNames: string[];
  },
];

export = {
  meta: {
    type: 'suggestion',
    messages: {
      illegalFunctionFound: 'Avoid using functions named "{{ name }}()"',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          illegalFunctionNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 1,
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context: TSESLint.RuleContext<MessageIds, Options>) => ({
    CallExpression: (node: TSESTree.CallExpression) => {
      // we only care about the callees that have a name
      if (node.callee.type !== AST_NODE_TYPES.Identifier) {
        return;
      }

      if (context.options[0].illegalFunctionNames.includes(node.callee.name)) {
        context.report({
          node: node.callee,
          messageId: 'illegalFunctionFound',
          data: {
            name: node.callee.name,
          },
        });
      }
    },
  }),
};
