import {
  buildSnapEndowmentSpecifications,
  buildSnapRestrictedMethodSpecifications,
} from '@metamask/snaps-rpc-methods';
import { Messenger, MOCK_ANY_NAMESPACE } from '@metamask/messenger';
import { RestrictedMethods } from '../permissions';
import {
  EndowmentPermissions,
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from './permissions';

describe('buildSnapRestrictedMethodSpecifications', () => {
  it('creates valid permission specification objects', () => {
    const hooks = {
      getUnlockPromise: jest.fn(),
      getClientCryptography: jest.fn(),
      isOnPhishingList: jest.fn(),
      maybeUpdatePhishingList: jest.fn(),
      getSnapKeyring: jest.fn(),
      getPreferences: jest.fn(),
    };

    const messenger = new Messenger({ namespace: MOCK_ANY_NAMESPACE });

    const specifications = buildSnapRestrictedMethodSpecifications(
      Object.keys(ExcludedSnapPermissions),
      hooks,
      messenger,
    );

    const allRestrictedMethods = Object.keys(RestrictedMethods);
    Object.keys(specifications).forEach((permissionKey) =>
      expect(allRestrictedMethods).toContain(permissionKey),
    );

    Object.values(specifications).forEach((specification) => {
      expect(specification).toMatchObject({
        targetName: expect.stringMatching(/^(snap_|wallet_)/u),
        methodImplementation: expect.any(Function),
      });
    });
  });
});

describe('buildSnapEndowmentSpecifications', () => {
  it('creates valid permission specification objects', () => {
    expect(
      Object.keys(
        buildSnapEndowmentSpecifications(Object.keys(ExcludedSnapEndowments)),
      ).sort(),
    ).toStrictEqual(
      Object.keys(EndowmentPermissions)
        .filter(
          (targetName) =>
            !Object.keys(ExcludedSnapEndowments).includes(targetName),
        )
        .sort(),
    );
  });
});
