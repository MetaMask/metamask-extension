'use strict';

/**
 * Custom ESLint rule: enforce E2E page-object member order.
 *
 * Required order inside a page-object class:
 *   1. Selectors      — every class *property* (`PropertyDefinition`), whether
 *                       its value is a string, an object, or an arrow function
 *                       that builds a dynamic locator.
 *   2. Constructor
 *   3. Action methods — every class *method* (`MethodDefinition`) that drives
 *                       the `driver`.
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
 * @param {import('estree').Node} member
 * @returns {number | null} one of GROUP.*, or null for members we ignore
 */
function classify(member) {
  if (member.type === 'MethodDefinition') {
    return member.kind === 'constructor' ? GROUP.CONSTRUCTOR : GROUP.ACTION;
  }
  // PropertyDefinition covers strings, objects, AND arrow-function selectors.
  if (member.type === 'PropertyDefinition') {
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
