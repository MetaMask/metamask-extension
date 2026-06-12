/**
 * Used in renderer `switch (element.type)` default branches so that:
 * - TypeScript reports an error when a new `SchemaElement` variant is added but not handled.
 * - Malformed runtime values fail loudly instead of being silently omitted.
 * @param _element
 */
export function throwUnhandledPermissionSchemaElement(_element: never): never {
  throw new Error(
    'Unhandled permission schema element type. Update permission renderers when extending SchemaElement.',
  );
}
