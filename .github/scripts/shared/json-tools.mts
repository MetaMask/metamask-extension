/**
 * json-tools.mts
 *
 * Minimal JSONC (JSON with Comments) parser.
 * Zero npm dependencies — safe to import from dependency-free CI scripts.
 *
 * Supports:
 *  - Full-line `// …` comments
 *  - Inline `// …` comments (outside quoted strings)
 *  - Trailing commas before `]` or `}`
 *
 * Does NOT support `/* … *​/` block comments.
 */

/**
 * Strip `//` comments and trailing commas from a JSONC string so it
 * can be passed to `JSON.parse()`.
 */
export function stripJsonComments(jsonc: string): string {
  return jsonc
    .split('\n')
    .map((line) => {
      // Remove full-line comments
      if (line.trim().startsWith('//')) return '';
      // Remove inline comments: find '//' outside of quoted strings.
      // Walk through the line tracking whether we're inside a string.
      let inString = false;
      let escaped = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (!inString && ch === '/' && line[i + 1] === '/') {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join('\n')
    .replace(/,\s*([\]}])/g, '$1');
}
