import { migrate } from './159';

const expectedVersion = 159;
const previousVersion = 158;

describe(`migration #${expectedVersion}`, () => {
  it('does nothing if state has no KeyringController property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {},
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.KeyringController is not an object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        KeyringController: 'not-an-object',
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.KeyringController has no keyringsMetadata property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        KeyringController: {
          vault: 'vault',
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: ['0x1234567890abcdef'],
            },
          ],
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('removes keyringsMetadata from KeyringController state', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        KeyringController: {
          vault: 'vault',
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: ['0x1234567890abcdef'],
            },
          ],
          keyringsMetadata: {
            someKey: 'someValue',
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        KeyringController: {
          vault: 'vault',
          keyrings: [
            {
              type: 'HD Key Tree',
              accounts: ['0x1234567890abcdef'],
            },
          ],
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });
});
