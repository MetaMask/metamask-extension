import { defaultFixture } from '../e2e/default-fixture';

type SchemaType = string | SchemaType[] | { [key: string]: SchemaType } | null;

interface StateData {
  data: Record<string, unknown>;
  meta: {
    version: number;
  };
}

interface FixtureData {
  data: Record<string, unknown>;
}

interface SchemaMismatch {
  controller: string;
  currentSchema: SchemaType;
  fixtureSchema: SchemaType;
}

function normalizeSchema(schema: SchemaType): SchemaType {
  if (Array.isArray(schema)) {
    return ['array'];
  }
  if (typeof schema === 'object' && schema !== null) {
    // For nested objects, we only care about the structure, not the actual values
    const hasNestedData = Object.values(schema).some(
      (value) => typeof value === 'object' && value !== null,
    );

    if (hasNestedData) {
      const normalized: Record<string, SchemaType> = {};
      for (const [key, value] of Object.entries(schema)) {
        if (typeof value === 'object' && value !== null) {
          // For nested objects/arrays, we just care that they exist
          normalized[key] = Array.isArray(value) ? ['array'] : {};
        } else {
          normalized[key] = normalizeSchema(value);
        }
      }
      return normalized;
    }

    // If it's a leaf object (no nested objects), return it as is
    return schema;
  }
  return schema;
}

export function validateStateSchema(stateData: unknown): void {
  const defaultData = defaultFixture() as FixtureData;
  const typedStateData = stateData as StateData;
  const mismatches: SchemaMismatch[] = [];

  Object.keys(defaultData.data).forEach((controllerName) => {
    const currentController = typedStateData.data[controllerName];
    const fixtureController = defaultData.data[controllerName];

    const currentSchema = normalizeSchema(getObjectSchema(currentController));
    const fixtureSchema = normalizeSchema(getObjectSchema(fixtureController));

    if (JSON.stringify(currentSchema) !== JSON.stringify(fixtureSchema)) {
      mismatches.push({
        controller: controllerName,
        currentSchema,
        fixtureSchema,
      });
    }
  });

  if (mismatches.length > 0) {
    console.error('Schema validation failed for multiple controllers:');
    mismatches.forEach(({ controller, currentSchema, fixtureSchema }) => {
      console.error(`\n${controller}:`);
      console.error('Current Schema:', JSON.stringify(currentSchema, null, 2));
      console.error('Fixture Schema:', JSON.stringify(fixtureSchema, null, 2));
    });
    throw new Error(
      `Schema mismatches found in ${mismatches.length} controllers. Please update the default-fixture file to match the current state schema.`,
    );
  }
}

function getObjectSchema(obj: unknown): SchemaType {
  if (obj === null) {
    return 'null';
  }
  if (Array.isArray(obj)) {
    // If array is empty in either fixture, consider them equivalent
    return ['array'];
  }
  if (typeof obj === 'object') {
    const schema: Record<string, SchemaType> = {};
    // If object is empty in either fixture, consider them equivalent
    if (Object.keys(obj as Record<string, unknown>).length === 0) {
      return {};
    }
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      schema[key] = getObjectSchema(value);
    }
    return schema;
  }
  return typeof obj;
}