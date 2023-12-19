import type { LoaderContext } from 'webpack';
import type { JSONSchema7 } from 'schema-utils/declarations/validate';
import { validate } from 'schema-utils';
import { removeFencedCode, Features } from '../../development/build/transforms/remove-fenced-code';

const schema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ["features"],
  format: "json",
  properties: {
    features: {
      type: 'object',
      description: "Configuration for code fence removal, specifying active and all possible features.",
      required: ["active", "all"],
      properties: {
        active: {
          description: "Features that should be included in the output.",
          type: "object",
        },
        all: {
          description: "All features that can be toggled.",
          type: "object",
        }
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false
};

const configuration = {
  name: codeFenceLoader.name,
};

export type CodeFenceLoaderOptions = {
  features: Features,
};

export default function codeFenceLoader(
  this: LoaderContext<CodeFenceLoaderOptions>,
  source: string,
) {
  const options = this.getOptions();
  validate(schema, options, configuration);
  return removeFencedCode(this.resourcePath, options.features, source)[0];
}