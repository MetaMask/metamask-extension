import { PermissionType, SubjectType } from '@metamask/permission-controller';

import { caip25EndowmentBuilder, permissionName } from './caip25permissions';

describe('endowment:caip25', () => {
  it('builds the expected permission specification', () => {
    const specification = caip25EndowmentBuilder.specificationBuilder({});
    expect(specification).toStrictEqual({
      permissionType: PermissionType.Endowment,
      targetName: permissionName,
      endowmentGetter: expect.any(Function),
      allowedCaveats: null,
      subjectTypes: [SubjectType.Website],
    });

    expect(specification.endowmentGetter()).toBeNull();
  });
});
