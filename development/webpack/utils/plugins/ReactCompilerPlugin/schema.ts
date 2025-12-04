import type { ExtendedJSONSchema } from 'json-schema-to-ts';

/**
 * Reusable schema for webpack RuleSetCondition.
 * Supports string, RegExp, array, function, or logical condition objects.
 */
const ruleSetConditionSchema = {
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
    { instanceof: 'Function', tsType: '((value: string) => boolean)' },
    {
      type: 'object',
      properties: {
        and: { type: 'array' },
        or: { type: 'array' },
        not: {},
      },
      additionalProperties: false,
    },
  ],
} as const;

/**
 * Schema for ExternalFunction.
 */
const externalFunctionSchema = {
  type: 'object',
  required: ['source', 'importSpecifierName'],
  properties: {
    source: {
      description: 'Module source path for the external function.',
      type: 'string',
    },
    importSpecifierName: {
      description: 'Name of the import specifier.',
      type: 'string',
    },
  },
  additionalProperties: false,
} as const;

/**
 * Schema for DynamicGatingOptions.
 */
const dynamicGatingSchema = {
  type: 'object',
  required: ['source'],
  properties: {
    source: {
      description: 'Module source path for dynamic gating.',
      type: 'string',
    },
  },
  additionalProperties: false,
} as const;

/**
 * Schema for MetaInternalTarget (internal use only).
 */
const metaInternalTargetSchema = {
  type: 'object',
  required: ['kind', 'runtimeModule'],
  properties: {
    kind: {
      type: 'string',
      const: 'donotuse_meta_internal',
    },
    runtimeModule: {
      description: 'Custom runtime module path.',
      type: 'string',
    },
  },
  additionalProperties: false,
} as const;

/**
 * JSON Schema for validating ReactCompilerPlugin options.
 * Uses schema-utils for runtime validation of plugin configuration.
 *
 * This schema validates options that map to:
 * - `ReactCompilerLoaderOption` from react-compiler-webpack
 * - `PluginOptions` from babel-plugin-react-compiler
 * - Webpack RuleSetRule conditions (test, include, exclude)
 */
export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['target'],
  properties: {
    // Core compiler options
    target: {
      description:
        'The target React version for the compiler. Should match the React version used in your project.',
      oneOf: [
        {
          type: 'string',
          enum: ['17', '18', '19'],
        },
        metaInternalTargetSchema,
      ],
    },
    verbose: {
      description:
        'Enable verbose logging of compilation events. When enabled, logs each successful compilation and errors to console, and prints a summary after each build.',
      type: 'boolean',
      default: false,
    },
    debug: {
      description:
        "Debug level for build failure behavior. 'all': Fail on all errors. 'critical': Fail only on critical errors. 'none': Never fail. Maps to panicThreshold internally.",
      type: 'string',
      enum: ['all', 'critical', 'none'],
      default: 'none',
    },
    compilationMode: {
      description:
        "Compilation mode for the React Compiler. 'syntax': Only compile functions with explicit directive. 'infer': Infer memoization based on heuristics. 'annotation': Compile functions with annotations. 'all': Compile all functions.",
      type: 'string',
      enum: ['syntax', 'infer', 'annotation', 'all'],
    },

    // Gating options
    gating: {
      description:
        'Gating function configuration. When set, the compiler will use this function to gate compiled output.',
      oneOf: [externalFunctionSchema, { type: 'null' }],
    },
    dynamicGating: {
      description:
        'Dynamic gating options. Allows runtime gating of compiled code.',
      oneOf: [dynamicGatingSchema, { type: 'null' }],
    },

    // Emit options
    noEmit: {
      description:
        'When true, the compiler will not emit any output. Useful for validation-only runs.',
      type: 'boolean',
      default: false,
    },

    // Suppression options
    eslintSuppressionRules: {
      description:
        'ESLint suppression rules to recognize. Array of ESLint rule names that should be treated as React Compiler suppressions.',
      oneOf: [
        {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
        },
        { type: 'null' },
      ],
    },
    flowSuppressions: {
      description: 'Enable Flow suppression comment recognition.',
      type: 'boolean',
      default: false,
    },
    ignoreUseNoForget: {
      description:
        'Ignore "use no forget" directive. When true, the compiler will process functions even if they have this directive.',
      type: 'boolean',
      default: false,
    },
    customOptOutDirectives: {
      description:
        'Custom opt-out directives. Array of custom directive strings that should disable compilation.',
      oneOf: [
        {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
        },
        { type: 'null' },
      ],
    },

    // Source filtering
    sources: {
      description:
        'Source file patterns to include. Array of glob patterns or a function that returns true for files to compile.',
      oneOf: [
        {
          type: 'array',
          items: { type: 'string' },
        },
        {
          instanceof: 'Function',
          tsType: '((filename: string) => boolean)',
        },
        { type: 'null' },
      ],
    },

    // Library compatibility
    enableReanimatedCheck: {
      description: 'Enable Reanimated library compatibility check.',
      type: 'boolean',
      default: false,
    },

    // Babel options
    babelTransformOptions: {
      description:
        'Babel transform options to pass to the underlying Babel transform. Allows customization of the Babel compilation process.',
      type: 'object',
      additionalProperties: true,
    },

    // Webpack RuleSetRule options
    include: {
      description:
        'Regex pattern or patterns to include files for compilation. Files must match at least one pattern to be processed.',
      ...ruleSetConditionSchema,
    },
    exclude: {
      description:
        'Regex pattern or patterns to exclude files from compilation. Files matching any pattern will be skipped.',
      ...ruleSetConditionSchema,
    },
    test: {
      description:
        'Test pattern for matching files to be processed by the loader. Defaults to match .js, .jsx, .ts, .tsx, .mjs, .mts files, excluding test, stories, and container files.',
      ...ruleSetConditionSchema,
    },
  },
  additionalProperties: false,
} satisfies ExtendedJSONSchema<Record<'instanceof' | 'tsType', string>>;
