'use strict';

// origin: ai-synthesis (MWPE-316)

const path = require('node:path');

/**
 * Custom ESLint rule: disallow direct writes to `storage.local` outside an
 * allowlist of intentional low-level callers.
 *
 * Controller state is persisted by `PersistenceManager`, and large non-state
 * data by `StorageService`. A direct `storage.local.set()` / `remove()` /
 * `clear()` bypasses both. The rule matches `storage.local` on any object
 * (`browser`, `chrome`, an injected `browserApi`), including bracket access.
 *
 * A reference that is not immediately a read (`get`, `getKeys`,
 * `getBytesInUse`, `onChanged`, `QUOTA_BYTES`) is reported, because an alias
 * (`const storageLocal = browser.storage.local`), a destructured `local` or a
 * `storage.local` passed into a helper can be written through out of sight.
 *
 * Allowlisted files are still linted: an entry whose file no longer has a
 * reportable reference is reported as stale, so the allowlist shrinks as
 * callers are removed.
 */

const ALLOWLIST_LOCATION =
  'development/eslint-storage-local-write-allowlist.js';

const READ_ONLY_MEMBERS = new Set([
  'get',
  'getBytesInUse',
  'getKeys',
  'onChanged',
  'QUOTA_BYTES',
]);

const TRANSPARENT_WRAPPERS = new Set([
  'ChainExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
]);

const GUIDANCE = `Persist controller state through its state metadata (\`persist: true\`) so PersistenceManager writes it, and store large non-state data through StorageService (\`StorageService:setItem\`). If this file is an intentional low-level boundary, add it with an owner and a reason to ${ALLOWLIST_LOCATION}.`;

/**
 * @param {import('estree').MemberExpression} node
 * @returns {string | null} the property name when it is known statically
 */
function getStaticPropertyName(node) {
  const { computed, property } = node;
  if (!computed && property.type === 'Identifier') {
    return property.name;
  }
  if (property.type === 'Literal' && typeof property.value === 'string') {
    return property.value;
  }
  if (
    property.type === 'TemplateLiteral' &&
    property.expressions.length === 0
  ) {
    return property.quasis[0].value.cooked;
  }
  return null;
}

/**
 * @param {import('estree').Property} property
 * @returns {string | null} the key name when it is known statically
 */
function getPropertyKeyName(property) {
  const { computed, key } = property;
  if (!computed && key.type === 'Identifier') {
    return key.name;
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }
  return null;
}

/**
 * @param {import('estree').Node} node
 * @returns {import('estree').Node} the node with type assertions and optional
 * chains removed
 */
function unwrap(node) {
  let current = node;
  while (TRANSPARENT_WRAPPERS.has(current.type)) {
    current = current.expression;
  }
  return current;
}

/**
 * @param {import('estree').Node} node
 * @returns {import('estree').Node} the outermost wrapper around `node`
 */
function skipWrappers(node) {
  let current = node;
  while (current.parent && TRANSPARENT_WRAPPERS.has(current.parent.type)) {
    current = current.parent;
  }
  return current;
}

/**
 * @param {import('estree').Node | null | undefined} node
 * @returns {boolean} whether `node` is `storage` or `<anything>.storage`
 */
function isStorageObject(node) {
  if (!node) {
    return false;
  }
  const target = unwrap(node);
  if (target.type === 'Identifier') {
    return target.name === 'storage';
  }
  return (
    target.type === 'MemberExpression' &&
    getStaticPropertyName(target) === 'storage'
  );
}

/**
 * @param {import('estree').ObjectPattern} pattern
 * @returns {boolean} whether the pattern destructures from a `storage` object
 */
function isDestructuredFromStorage(pattern) {
  const { parent } = pattern;
  switch (parent.type) {
    case 'VariableDeclarator':
      return parent.id === pattern && isStorageObject(parent.init);
    case 'AssignmentExpression':
      return parent.left === pattern && isStorageObject(parent.right);
    case 'AssignmentPattern':
      return parent.left === pattern && isStorageObject(parent.right);
    case 'Property':
      // `const { storage: { local } } = browser;`
      return (
        parent.value === pattern &&
        parent.parent.type === 'ObjectPattern' &&
        getPropertyKeyName(parent) === 'storage'
      );
    default:
      return false;
  }
}

/**
 * @param {string} cwd
 * @param {string} filename
 * @returns {string} `filename` relative to `cwd`, with forward slashes
 */
function toRelativePosixPath(cwd, filename) {
  return path.relative(cwd, filename).split(path.sep).join('/');
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow direct `storage.local` writes outside the allowlist of intentional low-level callers',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowlist: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                file: { type: 'string' },
                owner: { type: ['string', 'null'] },
                reason: { type: 'string' },
              },
              required: ['file', 'owner', 'reason'],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      directWrite: `Direct \`storage.local.{{ member }}\` bypasses PersistenceManager. ${GUIDANCE}`,
      escapedReference: `\`storage.local\` is aliased, destructured or passed as a value here, so writes through it cannot be checked. ${GUIDANCE}`,
      staleAllowlistEntry: `This file is on the direct \`storage.local\` allowlist but no longer writes to it. Remove its entry from ${ALLOWLIST_LOCATION}.`,
    },
  },

  create(context) {
    const { allowlist = [] } = context.options[0] ?? {};
    const relativeFilename = toRelativePosixPath(context.cwd, context.filename);
    const isAllowlisted = allowlist.some(
      (entry) => entry.file === relativeFilename,
    );

    /** @type {{ node: import('estree').Node, messageId: string, data?: Record<string, string> }[]} */
    const violations = [];

    return {
      MemberExpression(node) {
        if (
          getStaticPropertyName(node) !== 'local' ||
          !isStorageObject(node.object)
        ) {
          return;
        }

        const outer = skipWrappers(node);
        const { parent } = outer;

        if (parent.type === 'MemberExpression' && parent.object === outer) {
          const member = getStaticPropertyName(parent);
          if (member !== null && READ_ONLY_MEMBERS.has(member)) {
            return;
          }
          violations.push({
            node: parent,
            messageId: 'directWrite',
            data: { member: member ?? '[computed]' },
          });
          return;
        }

        if (parent.type === 'UnaryExpression' && parent.operator === 'typeof') {
          return;
        }

        violations.push({ node, messageId: 'escapedReference' });
      },

      ObjectPattern(node) {
        const localProperty = node.properties.find(
          (property) =>
            property.type === 'Property' &&
            getPropertyKeyName(property) === 'local',
        );
        if (!localProperty || !isDestructuredFromStorage(node)) {
          return;
        }
        violations.push({ node: localProperty, messageId: 'escapedReference' });
      },

      'Program:exit'(node) {
        if (!isAllowlisted) {
          violations.forEach((violation) => context.report(violation));
          return;
        }
        if (violations.length === 0) {
          context.report({ node, messageId: 'staleAllowlistEntry' });
        }
      },
    };
  },
};
