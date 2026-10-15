'use strict';

/**
 * Custom ESLint rule: enforce E2E page-object member order.
 *
 * Required order inside a page-object class:
 *   1. Selectors      — class *properties* (`PropertyDefinition`): strings,
 *                       objects, and arrow functions that build locators.
 *   2. Constructor
 *   3. Action methods — class *methods* (`MethodDefinition`) and arrow-function
 *                       properties that drive the `driver` (async arrows, or any
 *                       arrow whose body references `this.driver`).
 *
 * Members are additionally required to be alphabetical within each group, to
 * match the existing `order: 'alphabetically'` convention.
 */

const GROUP = { SELECTOR: 0, CONSTRUCTOR: 1, ACTION: 2 };

const GROUP_LABEL = {
  [GROUP.SELECTOR]: 'selector',
  [GROUP.CONSTRUCTOR]: 'constructor',
  [GROUP.ACTION]: 'action method',
};

/**
 * @param {import('estree').MethodDefinition | import('estree').PropertyDefinition} member
 * @returns {string | null}
 */
function getMemberName(member) {
  const { key } = member;
  if (!key) {
    return null;
  }
  switch (key.type) {
    case 'Identifier':
      return key.name;
    case 'PrivateIdentifier':
      return `#${key.name}`;
    case 'Literal':
      return String(key.value);
    default:
      return null;
  }
}

/**
 * @param {import('estree').Node | null | undefined} node
 * @returns {boolean}
 */
function usesThisDriver(node) {
  if (!node || typeof node !== 'object') {
    return false;
  }

  if (
    node.type === 'MemberExpression' &&
    node.object?.type === 'ThisExpression'
  ) {
    const { property } = node;
    if (property?.type === 'Identifier' && property.name === 'driver') {
      return true;
    }
    if (property?.type === 'Literal' && property.value === 'driver') {
      return true;
    }
  }

  for (const key of Object.keys(node)) {
    if (key === 'parent') {
      continue;
    }
    const child = node[key];
    if (Array.isArray(child)) {
      if (child.some((item) => usesThisDriver(item))) {
        return true;
      }
    } else if (child && typeof child === 'object' && child.type) {
      if (usesThisDriver(child)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * @param {import('estree').PropertyDefinition} member
 * @returns {boolean}
 */
function isArrowFunctionAction(member) {
  const { value } = member;
  if (value?.type !== 'ArrowFunctionExpression') {
    return false;
  }

  return value.async || usesThisDriver(value.body);
}

/**
 * @param {import('estree').Node} member
 * @returns {number | null} one of GROUP.*, or null for members we ignore
 */
function classify(member) {
  if (member.type === 'MethodDefinition') {
    return member.kind === 'constructor' ? GROUP.CONSTRUCTOR : GROUP.ACTION;
  }
  if (member.type === 'PropertyDefinition') {
    if (isArrowFunctionAction(member)) {
      return GROUP.ACTION;
    }
    return GROUP.SELECTOR;
  }
  // StaticBlock, TSIndexSignature, etc. are ignored.
  return null;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'enforce selector-first member order in E2E page objects (selectors, then constructor, then action methods)',
    },
    schema: [],
    messages: {
      groupOrder:
        'A {{ current }} ("{{ name }}") must be declared before {{ before }}.',
      alphabetical:
        '{{ group }} "{{ name }}" should be declared before "{{ other }}" (alphabetical order).',
    },
  },

  create(context) {
    /**
     * @param {import('estree').ClassBody} classBody
     */
    function check(classBody) {
      const members = classBody.body
        .map((node) => ({
          node,
          group: classify(node),
          name: getMemberName(node),
        }))
        .filter((member) => member.group !== null && member.name !== null);

      // 1. Group ordering: selectors < constructor < actions.
      let highestGroupSeen = GROUP.SELECTOR;
      for (const member of members) {
        if (member.group < highestGroupSeen) {
          context.report({
            node: member.node,
            messageId: 'groupOrder',
            data: {
              current: GROUP_LABEL[member.group],
              name: member.name,
              before: `all ${GROUP_LABEL[highestGroupSeen]}s`,
            },
          });
        } else {
          highestGroupSeen = member.group;
        }
      }

      // 2. Alphabetical ordering within each group.
      let previous = null;
      for (const member of members) {
        if (
          previous &&
          previous.group === member.group &&
          member.name.localeCompare(previous.name) < 0
        ) {
          context.report({
            node: member.node,
            messageId: 'alphabetical',
            data: {
              group: GROUP_LABEL[member.group],
              name: member.name,
              other: previous.name,
            },
          });
        }
        previous = member;
      }
    }

    return { ClassBody: check };
  },
};
