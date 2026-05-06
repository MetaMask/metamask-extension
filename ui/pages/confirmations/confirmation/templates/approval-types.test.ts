import { APPROVAL_TEMPLATES } from './index';
import { TEMPLATED_CONFIRMATION_APPROVAL_TYPES } from './approval-types';

describe('TEMPLATED_CONFIRMATION_APPROVAL_TYPES', () => {
  it('stays in sync with the keys of APPROVAL_TEMPLATES', () => {
    // The list is duplicated rather than derived so that shared-layer
    // consumers (e.g. `ui/selectors/selectors.js`) can read the type list
    // without transitively pulling in the template implementations — which
    // import from `ui/store/actions` and would otherwise close a cycle.
    // This test guards against drift between the two lists.
    expect([...TEMPLATED_CONFIRMATION_APPROVAL_TYPES].sort()).toStrictEqual(
      Object.keys(APPROVAL_TEMPLATES).sort(),
    );
  });
});
