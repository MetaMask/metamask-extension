import type { LoaderContext, RuleSetRule } from 'webpack';
import type { JSONSchema7 } from 'json-schema';
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
          description:
            'Features that should be included in the output. Can be Set (direct) or array (serialized through thread-loader).',
          type: 'array',
          items: { type: 'string' },
        },
        all: {
          description:
            'All features that can be toggled. Can be Set (direct) or array (serialized through thread-loader).',
          type: 'array',
          items: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

export type CodeFenceLoaderOptions = { features: FeatureLabels };

// When passed through thread-loader, options are serialized to JSON.
// Sets become arrays, so we need to reconstruct them.
export type SerializedFeatureLabels = {
  active: Set<string> | string[];
  all: Set<string> | string[];
};
export type SerializedCodeFenceLoaderOptions = {
  features: SerializedFeatureLabels;
};

// Type for the serialized loader configuration (used with thread-loader)
type SerializedLoaderOptions = {
  features: { active: string[]; all: string[] };
};

type Context = LoaderContext<SerializedCodeFenceLoaderOptions>;
function codeFenceLoader(this: Context, content: string, map?: string) {
  const options = this.getOptions();
  validate(schema, options, { name: 'codeFenceLoader' });

  // Reconstruct Sets if they were serialized to arrays by thread-loader
  const features: FeatureLabels = {
    active:
      options.features.active instanceof Set
        ? options.features.active
        : new Set(options.features.active),
    all:
      options.features.all instanceof Set
        ? options.features.all
        : new Set(options.features.all),
  };

  try {
    const result = removeFencedCode(this.resourcePath, content, features);
    this.callback(null, result[0], map);
  } catch (error: unknown) {
    this.callback(error as Error);
  }
}

export default codeFenceLoader;

export type Loader = RuleSetRule & { options: SerializedLoaderOptions };

export function getCodeFenceLoader(features: FeatureLabels): Loader {
  // Convert Sets to arrays for JSON serialization through thread-loader
  return {
    loader: require.resolve('./codeFenceLoader'),
    options: {
      features: {
        active: Array.from(features.active),
        all: Array.from(features.all),
      },
    },
  };
}
