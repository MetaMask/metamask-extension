import migration68 from './068';

describe('migration #68', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 67,
      },
      data: {},
    };

    const newStorage = await migration68.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 68,
    });
  });

  it('should set preference ipfsGateway to "https://cloudflare-ipfs.com/ipfs/" if ipfsGateway is old default dweb.link', async () => {
    const expectedValue = 'https://cloudflare-ipfs.com/ipfs/';
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            ipfsGateway: 'dweb.link',
          },
        },
      },
    };

    const newStorage = await migration68.migrate(oldStorage);
    expect(newStorage.data.PreferencesController.preferences.ipfsGateway).toBe(
      expectedValue,
    );
  });

  it('should update preference ipfsGateway to a full url version of user set ipfsGateway if ipfsGateway is not old default dweb.link', async () => {
    const expectedValue = 'https://random.ipfs/ipfs/';
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            ipfsGateway: 'random.ipfs',
          },
        },
      },
    };

    const newStorage = await migration68.migrate(oldStorage);
    expect(newStorage.data.PreferencesController.preferences.ipfsGateway).toBe(
      expectedValue,
    );
  });
});
