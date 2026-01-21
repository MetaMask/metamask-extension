import type { LoaderContext } from 'webpack';

const PROCESS_ENV_REGEX = /process\.env\.([A-Z_][A-Z0-9_]*)/g;

export type EnvValidationLoaderOptions = {
  declarations: Set<string>;
};

/**
 * A webpack loader that validates environment variable usage against declared variables.
 *
 * Scans source files for `process.env.VARIABLE_NAME` references and verifies each
 * variable is declared in `builds.yml`. Emits a webpack error listing any undeclared
 * variables found, helping catch configuration issues at build time.
 *
 * @example
 * // webpack.config.ts
 * {
 *   loader: 'envValidationLoader',
 *   options: { declarations: new Set(['NODE_ENV', 'API_URL']) }
 * }
 * @param source - The source code content of the file being processed.
 * @returns The unmodified source code (this loader only validates, doesn't transform).
 * @throws Emits a webpack error (via `this.emitError`) if any `process.env.*` references
 *         are found that aren't included in the `declarations` set.
 */
export default function envValidationLoader(
  this: LoaderContext<EnvValidationLoaderOptions>,
  source: string,
) {
  const { declarations } = this.getOptions();
  const undeclaredVars: string[] = [];

  let match;
  while ((match = PROCESS_ENV_REGEX.exec(source)) !== null) {
    const varName = match[1];
    if (!declarations.has(varName)) {
      undeclaredVars.push(varName);
    }
  }

  if (undeclaredVars.length > 0) {
    const uniqueVars = [...new Set(undeclaredVars)];
    this.emitError(
      new Error(
        `Undeclared environment variables in ${this.resourcePath}:\n${uniqueVars
          .map((v) => `  - ${v}`)
          .join('\n')}\n\nAdd these to builds.yml under "env" to fix this.`,
      ),
    );
  }

  return source;
}
