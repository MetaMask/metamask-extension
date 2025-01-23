import { createMockInternalAccount } from '../../../test/jest/mocks';
import { migrate, version } from './140';

const oldVersion = 139;

const mockInternalAccount = createMockInternalAccount();
const mockInternalAccount2 = createMockInternalAccount({
  address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
});

describe(`migration #${version}`, () => {
  it('updates the version number', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {},
    };
    const newData = await migrate(oldData);
    expect(newData.meta.version).toBe(version);
  });

  it('leaves state unchanged when KeyringController is missing', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {
        foo: 'bar',
      },
    };
    // @ts-expect-error testing error
    const newData = await migrate(oldData);
    expect(newData.data).toEqual(oldData.data);
  });

  it('adds keyringsMetadata when KeyringController exists with empty metadata', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {
        KeyringController: {
          keyrings: [{ type: 'HD Key Tree' }, { type: 'Simple Key Pair' }],
          keyringsMetadata: [],
        },
        AccountsController: {
          internalAccounts: {
            accounts: {
              [mockInternalAccount.id]: mockInternalAccount,
              [mockInternalAccount2.id]: mockInternalAccount2,
            },
            selectedAccount: mockInternalAccount.id,
          },
        },
      },
    };
    // @ts-expect-error testing error
    const newData = await migrate(oldData);
    expect(newData.data.KeyringController?.keyringsMetadata).toHaveLength(2);
    expect(newData.data.KeyringController?.keyringsMetadata[0]).toHaveProperty(
      'id',
    );
    expect(newData.data.KeyringController?.keyringsMetadata[0]).toHaveProperty(
      'name',
      '',
    );
  });

  it('adds keyringsMetadata when KeyringController exists with undefined metadata', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {
        KeyringController: {
          keyrings: [{ type: 'HD Key Tree' }],
        },
        AccountsController: {
          internalAccounts: {
            accounts: {
              [mockInternalAccount.id]: mockInternalAccount,
            },
            selectedAccount: mockInternalAccount.id,
          },
        },
      },
    };
    // @ts-expect-error testing when keyringsMetadata is undefined
    const newData = await migrate(oldData);
    expect(newData.data.KeyringController?.keyrings).toBeDefined();
    expect(newData.data.KeyringController?.keyringsMetadata).toHaveLength(1);
    expect(newData.data.KeyringController?.keyringsMetadata[0]).toHaveProperty(
      'id',
    );
    expect(newData.data.KeyringController?.keyringsMetadata[0]).toHaveProperty(
      'name',
      '',
    );
  });

  it('preserves existing keyringsMetadata', async () => {
    const existingMetadata = [{ id: '123', name: 'Existing' }];
    const oldData = {
      meta: { version: oldVersion },
      data: {
        KeyringController: {
          isUnlocked: true,
          keyrings: [{ type: 'HD Key Tree', accounts: [] }],
          keyringsMetadata: existingMetadata,
        },
        AccountsController: {
          internalAccounts: {
            accounts: {
              [mockInternalAccount.id]: mockInternalAccount,
            },
            selectedAccount: mockInternalAccount.id,
          },
        },
      },
    };
    const newData = await migrate(oldData);
    expect(newData.data.KeyringController?.keyringsMetadata).toEqual(
      existingMetadata,
    );
  });

  it('handles missing AccountsController', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {
        KeyringController: {
          keyrings: [{ type: 'HD Key Tree' }],
          keyringsMetadata: [],
        },
      },
    };
    // @ts-expect-error testing missing accounts controller state
    const newData = await migrate(oldData);
    expect(newData.data.KeyringController?.keyringsMetadata).toHaveLength(0);
  });

  it('handles invalid AccountsController structure', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {
        KeyringController: {
          keyrings: [{ type: 'HD Key Tree' }],
          keyringsMetadata: [],
        },
        AccountsController: {}, // Missing internalAccounts
      },
    };
    // @ts-expect-error testing invalid accounts controller state
    const newData = await migrate(oldData);
    expect(newData.data.KeyringController?.keyringsMetadata).toHaveLength(0);
  });
});
