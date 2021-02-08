import { buildSnapPermissionSpecifications } from './snap-permissions';

describe('buildSnapPermissionSpecifications', () => {
  it('creates valid permission specification objects', () => {
    const hooks = {
      addSnap: () => undefined,
      clearSnapState: () => undefined,
      getMnemonic: () => undefined,
      getSnap: () => undefined,
      getSnapRpcHandler: () => undefined,
      getSnapState: () => undefined,
      showConfirmation: () => undefined,
      updateSnapState: () => undefined,
    };

    const specifications = buildSnapPermissionSpecifications(hooks);

    Object.values(specifications).forEach((specification) => {
      expect(specification).toMatchObject({
        targetKey: expect.stringMatching(/^(snap_|wallet_)/u),
        methodImplementation: expect.any(Function),
        allowedCaveats: null,
      });
    });
  });
});
