import { throwUnhandledPermissionSchemaElement } from './throw-unhandled-permission-schema-element';

describe('throwUnhandledPermissionSchemaElement', () => {
  it('throws a descriptive error', () => {
    expect(() =>
      throwUnhandledPermissionSchemaElement(undefined as never),
    ).toThrow(
      'Unhandled permission schema element type. Update permission renderers when extending SchemaElement.',
    );
  });
});
