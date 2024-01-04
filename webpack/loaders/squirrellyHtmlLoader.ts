import type { LoaderContext } from 'webpack';
import type { JSONSchema7 } from 'schema-utils/declarations/validate';
import type { FromSchema } from 'json-schema-to-ts';
import { validate } from 'schema-utils';
import { render } from 'squirrelly';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  additionalProperties: true
} as const satisfies JSONSchema7;

export type SquirrellyHtmlLoaderOptions = FromSchema<typeof schema>;

const configuration = {
  name: squirrellyHtmlLoader.name,
};

export default function squirrellyHtmlLoader(this: LoaderContext<SquirrellyHtmlLoaderOptions>, source: string) {
  const options = this.getOptions();
  validate(schema, options, configuration);
  return render(source, options);
}
