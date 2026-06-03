'use strict';

/**
 * Postcss plugin that filters `@font-face` `src:` declarations to keep only
 * sources whose URL file extension is in `keepExtensions`.
 *
 * Replaces the unmaintained `postcss-discard-font-face` package (last release
 * 2016, built for postcss 5) with a minimal postcss-8-native implementation
 * covering only the single array-allowlist form we use.
 *
 * @param {string[]} keepExtensions - Extensions (without leading dot) to keep.
 * @returns {import('postcss').Plugin}
 */
function discardFontFace(keepExtensions) {
  const keep = new Set(keepExtensions.map((e) => e.toLowerCase()));

  return {
    postcssPlugin: 'discard-font-face',
    AtRule: {
      'font-face': (rule) => {
        rule.walkDecls('src', (decl) => filterSrc(decl, keep));
        // If all src entries were filtered out, discard the entire rule.
        if (!rule.some((node) => node.type === 'decl' && node.prop === 'src')) {
          rule.remove();
        }
      },
    },
  };
}
discardFontFace.postcss = true;

/**
 * Filter a `src` declaration to keep only entries whose URL extension is in `keep`.
 *
 * @param {import('postcss').Declaration} decl
 * @param {Set<string>} keep
 */
function filterSrc(decl, keep) {
  const entries = splitTopLevelCommas(decl.value);
  const kept = entries.filter((entry) => keepEntry(entry, keep));

  if (kept.length === 0) {
    decl.remove();
  } else if (kept.length !== entries.length) {
    decl.value = kept.join(', ');
  }
}

/**
 * Return whether a single `src` entry should be kept based on its URL extension.
 *
 * @param {string} entry
 * @param {Set<string>} keep
 */
function keepEntry(entry, keep) {
  const match = /url\(\s*(?:'([^']*)'|"([^"]*)"|([^'"()\s]+))\s*\)/u.exec(
    entry,
  );
  if (!match) {
    // Non-url() entry (e.g. `local(...)`); leave it alone.
    return true;
  }
  let url = match[1] ?? match[2] ?? match[3];
  const hash = url.lastIndexOf('#');
  if (hash !== -1) {
    url = url.slice(0, hash);
  }
  const query = url.lastIndexOf('?');
  if (query !== -1) {
    url = url.slice(0, query);
  }
  const dot = url.lastIndexOf('.');
  if (dot === -1) {
    return false;
  }
  return keep.has(url.slice(dot + 1).toLowerCase());
}

/**
 * Split a CSS value on top-level commas, respecting parentheses so that
 * `url(a, b)` or `format(a, b)` are not split.
 *
 * @param {string} value
 * @returns {string[]}
 */
function splitTopLevelCommas(value) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      out.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(value.slice(start).trim());
  return out;
}

module.exports = { discardFontFace };
module.exports.default = discardFontFace;
