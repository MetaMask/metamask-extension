/**
 * 3-pass {{param}} substitution engine.
 *
 * Pass 1: Apply caller-provided params
 * Pass 2: Apply input defaults from the recipe's `inputs` block
 * Pass 3: Apply inline defaults ({{key|fallback}})
 */

export type InputDef = {
  type: 'string' | 'number' | 'boolean';
  default?: unknown;
  description?: string;
};

const TEMPLATE_RE = /\{\{(\w+)(?:\|([^}]*))?\}\}/gu;

/**
 * Replace template tokens in a single string.
 *
 * @param str - The string containing template tokens
 * @param values - Key-value map of replacements
 * @param useInlineDefaults - Whether to apply {{key|default}} fallbacks
 * @returns The substituted string
 */
function replaceInString(
  str: string,
  values: Record<string, string>,
  useInlineDefaults: boolean,
): string {
  return str.replace(
    TEMPLATE_RE,
    (match, key: string, inlineDefault?: string) => {
      if (key in values) {
        return values[key];
      }
      if (useInlineDefaults && inlineDefault !== undefined) {
        return inlineDefault;
      }
      return match;
    },
  );
}

/**
 * Recursively walk a JSON tree and substitute template tokens in all string values.
 *
 * @param obj - The value to walk
 * @param values - Key-value map of replacements
 * @param useInlineDefaults - Whether to apply inline defaults
 * @returns The substituted value
 */
function walkAndReplace(
  obj: unknown,
  values: Record<string, string>,
  useInlineDefaults: boolean,
): unknown {
  if (typeof obj === 'string') {
    return replaceInString(obj, values, useInlineDefaults);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => walkAndReplace(item, values, useInlineDefaults));
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = walkAndReplace(val, values, useInlineDefaults);
    }
    return result;
  }
  return obj;
}

/**
 * Apply 3-pass template substitution to an entire recipe object.
 *
 * @param obj - The recipe JSON (or sub-tree) to substitute into
 * @param params - Caller-provided parameter overrides
 * @param inputs - The recipe's declared inputs with defaults
 * @returns A new object with all {{param}} tokens resolved
 */
export function substituteTemplates(
  obj: unknown,
  params: Record<string, string>,
  inputs: Record<string, InputDef>,
): unknown {
  // Pass 1: Apply caller params
  let result = walkAndReplace(obj, params, false);

  // Pass 2: Apply input defaults
  const defaults: Record<string, string> = {};
  for (const [key, def] of Object.entries(inputs)) {
    if (def.default !== undefined && !(key in params)) {
      defaults[key] = String(def.default);
    }
  }
  result = walkAndReplace(result, defaults, false);

  // Pass 3: Apply inline defaults for any remaining tokens
  result = walkAndReplace(result, {}, true);

  return result;
}
