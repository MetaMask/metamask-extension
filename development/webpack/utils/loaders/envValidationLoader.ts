import type { LoaderContext } from 'webpack';
import { parse, type ParseOptions } from '@swc/core';
import type {
  Node,
  MemberExpression,
  Expression,
  VariableDeclarator,
  ObjectPattern,
  AssignmentPatternProperty,
  KeyValuePatternProperty,
} from '@swc/types';

export type EnvValidationLoaderOptions = {
  declarations: Set<string>;
};

/**
 * Determines the parser syntax based on the file extension.
 *
 * Always enables JSX parsing since this loader only runs on the project's own
 * source files (not node_modules), and .js files in this codebase commonly
 * contain JSX. SWC can parse non-JSX code with JSX enabled, but not the reverse.
 *
 * @param resourcePath - The file path to determine syntax for.
 * @returns The parse options with appropriate syntax configuration.
 */
function getParseOptions(resourcePath: string): ParseOptions {
  const isTypeScript = /\.(?:ts|mts|tsx)$/u.test(resourcePath);

  if (isTypeScript) {
    return { syntax: 'typescript', tsx: true };
  }
  return { syntax: 'ecmascript', jsx: true };
}

/**
 * Type guard to check if a value is an AST Node.
 *
 * @param value - The value to check.
 * @returns True if the value is an AST Node.
 */
function isNode(value: unknown): value is Node {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    typeof value.type === 'string'
  );
}

/**
 * Checks if an expression is the `process.env` MemberExpression.
 *
 * @param expr - The expression to check.
 * @returns True if the expression is `process.env`.
 */
function isProcessEnv(expr: Expression): boolean {
  return (
    expr.type === 'MemberExpression' &&
    expr.object.type === 'Identifier' &&
    expr.object.value === 'process' &&
    expr.property.type === 'Identifier' &&
    expr.property.value === 'env'
  );
}

/**
 * Extracts the property name from a MemberExpression property.
 * Handles both dot notation (`process.env.VAR`) and bracket notation (`process.env["VAR"]`).
 *
 * @param property - The property node from a MemberExpression.
 * @returns The property name string, or null if it cannot be statically determined.
 */
function getPropertyName(
  property: MemberExpression['property'],
): string | null {
  // Handle dot notation: process.env.VAR
  if (property.type === 'Identifier') {
    return property.value;
  }

  // Handle bracket notation: process.env["VAR"] or process.env['VAR']
  if (
    property.type === 'Computed' &&
    property.expression.type === 'StringLiteral'
  ) {
    return property.expression.value;
  }

  // Dynamic access like process.env[someVar] cannot be statically analyzed
  return null;
}

/**
 * Extracts the key name from an ObjectPattern property used in destructuring.
 *
 * @param prop - The property from an ObjectPattern.
 * @returns The key name string, or null if it cannot be determined.
 */
function getDestructuredKeyName(
  prop: AssignmentPatternProperty | KeyValuePatternProperty,
): string | null {
  // Handle shorthand: const { VAR } = process.env
  if (prop.type === 'AssignmentPatternProperty') {
    return prop.key.value;
  }

  // Handle renamed: const { VAR: renamed } = process.env
  if (
    prop.type === 'KeyValuePatternProperty' &&
    prop.key.type === 'Identifier'
  ) {
    return prop.key.value;
  }

  return null;
}

/**
 * Recursively walks the AST and collects all environment variable names
 * accessed via `process.env`.
 *
 * Detects three patterns:
 * 1. `process.env.VAR` - dot notation access
 * 2. `process.env["VAR"]` - bracket notation access
 * 3. `const { VAR } = process.env` - destructuring assignment
 *
 * @param node - The AST node to walk.
 * @param envVars - Set to collect found environment variable names.
 */
function walkAst(node: Node, envVars: Set<string>): void {
  // Pattern 1 & 2: process.env.VAR or process.env["VAR"]
  if (node.type === 'MemberExpression') {
    const memberExpression = node as MemberExpression;
    if (isProcessEnv(memberExpression.object)) {
      const propName = getPropertyName(memberExpression.property);
      if (propName !== null) {
        envVars.add(propName);
      }
    }
  }

  // Pattern 3: const { VAR } = process.env
  if (node.type === 'VariableDeclarator') {
    const declarator = node as VariableDeclarator;
    if (
      declarator.id.type === 'ObjectPattern' &&
      declarator.init &&
      isProcessEnv(declarator.init)
    ) {
      const pattern = declarator.id as ObjectPattern;
      for (const prop of pattern.properties) {
        // Skip RestElement (spread operator)
        if (prop.type === 'RestElement') {
          continue;
        }
        const keyName = getDestructuredKeyName(prop);
        if (keyName !== null) {
          envVars.add(keyName);
        }
      }
    }
  }

  // Recursively walk all child nodes
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) {
          walkAst(item, envVars);
        }
      }
    } else if (isNode(value)) {
      walkAst(value, envVars);
    }
  }
}

/**
 * An async webpack loader that validates environment variable usage against declared variables.
 *
 * Uses SWC's async parser to parse source files into an AST and walks the tree to find
 * `process.env` access patterns. Detects the following patterns:
 *
 * 1. `process.env.VARIABLE_NAME` - dot notation
 * 2. `process.env["VARIABLE_NAME"]` - bracket notation
 * 3. `const { VARIABLE_NAME } = process.env` - destructuring
 *
 * Verifies each variable is declared in `builds.yml`. Emits a webpack error listing
 * any undeclared variables found, helping catch configuration issues at build time.
 * This is a validation-only loader; the source code is passed through unmodified.
 *
 * @example
 * // webpack.config.ts
 * {
 *   loader: 'envValidationLoader',
 *   options: { declarations: new Set(['NODE_ENV', 'API_URL']) }
 * }
 * @param source - The source code content of the file being processed.
 * @throws Emits a webpack error if any `process.env.*` references
 * are found that aren't included in the `declarations` set.
 */
export default function envValidationLoader(
  this: LoaderContext<EnvValidationLoaderOptions>,
  source: string,
) {
  const callback = this.async();
  const { declarations } = this.getOptions();
  const parseOptions = getParseOptions(this.resourcePath);

  (async () => {
    try {
      const ast = await parse(source, parseOptions);

      const foundEnvVars = new Set<string>();
      walkAst(ast, foundEnvVars);

      const undeclaredVars = [...foundEnvVars].filter(
        (varName) => !declarations.has(varName),
      );

      if (undeclaredVars.length > 0) {
        this.emitError(
          new Error(
            `Undeclared environment variables in ${this.resourcePath}:\n${undeclaredVars
              .map((v) => `  - ${v}`)
              .join('\n')}\n\nAdd these to builds.yml under "env" to fix this.`,
          ),
        );
      }

      callback(null, source);
    } catch (error) {
      this.emitError(
        new Error(
          `Environment variable validation error encountered while trying to parse ${this.resourcePath}. {${error instanceof Error ? error.message : String(error)}}`,
        ),
      );
      callback(null, source);
    }
  })();
}
