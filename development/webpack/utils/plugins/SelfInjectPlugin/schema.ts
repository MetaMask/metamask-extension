import { ExtendedJSONSchema } from 'json-schema-to-ts';

export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    exclude: {
      oneOf: [
        { type: 'string' },
        { instanceof: 'RegExp', tsType: 'RegExp' },
        {
          type: 'array',
          items: {
            oneOf: [
              { type: 'string' },
              { instanceof: 'RegExp', tsType: 'RegExp' },
            ],
          },
        },
      ],
    },
    include: {
      oneOf: [
        { type: 'string' },
        { instanceof: 'RegExp' },
        {
          type: 'array',
          items: {
            oneOf: [
              { type: 'string' },
              { instanceof: 'RegExp', tsType: 'RegExp' },
            ],
          },
        },
      ],
    },
    test: {
      oneOf: [
        { type: 'string' },
        { instanceof: 'RegExp', tsType: 'RegExp' },
        {
          type: 'array',
          items: {
            oneOf: [
              { type: 'string' },
              { instanceof: 'RegExp', tsType: 'RegExp' },
            ],
          },
        },
      ],
    },
    sourceUrlExpression: {
      instanceof: 'Function',
      tsType: '((filename: string) => string)',
    },
  },
  additionalProperties: false,
} satisfies ExtendedJSONSchema<Record<'instanceof' | 'tsType', string>>;
