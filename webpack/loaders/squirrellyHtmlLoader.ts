import type { LoaderContext } from 'webpack';
import type { JSONSchema7 } from 'schema-utils/declarations/validate';
import { validate } from 'schema-utils';
import { render } from 'squirrelly';

const schema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  additionalProperties: true
};

const configuration = {
  name: squirrellyHtmlLoader.name,
};

export default function squirrellyHtmlLoader(this: LoaderContext<object>, source: string) {
  const options = this.getOptions();
  validate(schema, options, configuration);
  return render(source, options);
}
