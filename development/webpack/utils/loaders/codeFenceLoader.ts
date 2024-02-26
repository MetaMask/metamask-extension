import type { LoaderContext, RuleSetRule } from 'webpack';
import type { JSONSchema7 } from 'schema-utils/declarations/validate';
import { validate } from 'schema-utils';
import { removeFencedCode, type FeatureLabels } from '@metamask/build-utils';

const schema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['features'],
  properties: {
    features: {
      type: 'object',
      description:
        'Configuration for code fence removal, specifying active and all possible features.',
      required: ['active', 'all'],
      properties: {
        active: {
          description: 'Features that should be included in the output.',
          type: 'object',
        },
        all: {
          description: 'All features that can be toggled.',
          type: 'object',
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

export type CodeFenceLoaderOptions = { features: FeatureLabels };

type Context = LoaderContext<CodeFenceLoaderOptions>;
function codeFenceLoader(this: Context, content: string, map?: string) {
  const options = this.getOptions();
  validate(schema, options, { name: 'codeFenceLoader' });
  try {
    const result = removeFencedCode(
      this.resourcePath,
      content,
      options.features,
    );
    this.callback(null, result[0], map);
  } catch (error: unknown) {
    this.callback(error as Error);
  }
}

export default codeFenceLoader;

export type Loader = RuleSetRule & { options: CodeFenceLoaderOptions };

export function getCodeFenceLoader(features: FeatureLabels): Loader {
  return {
    loader: __filename,
    options: { features },
  };
}
