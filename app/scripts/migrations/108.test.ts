import { migrate, version } from './108';

const oldVersion = 107;

describe('migration #108', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if no address book state', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('does nothing if no address book entries', async () => {
    const oldState = {
      OtherController: {},
      AddressBookController: {
        addressBook: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('adds name entries', async () => {
    const oldState = {
      OtherController: {},
      AddressBookController: {
        addressBook: {
          '0x1': {
            '0xc0ffee254729296a45a3885639AC7E10F9d54979': {
              name: 'TestName1',
              isEns: false,
            },
            '0xc0ffee254729296a45a3885639AC7E10F9d54978': {
              name: 'TestName2',
              isEns: true,
            },
          },
          '0x2': {
            '0xc0ffee254729296a45a3885639AC7E10F9d54977': {
              name: 'TestName3',
              isEns: false,
            },
            '0xc0ffee254729296a45a3885639AC7E10F9d54978': {
              name: 'TestName4',
              isEns: false,
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      ...oldState,
      NameController: {
        names: {
          ethereumAddress: {
            '0xc0ffee254729296a45a3885639ac7e10f9d54979': {
              '0x1': {
                name: 'TestName1',
                sourceId: null,
                proposedNames: {},
              },
            },
            '0xc0ffee254729296a45a3885639ac7e10f9d54978': {
              '0x1': {
                name: 'TestName2',
                sourceId: 'ens',
                proposedNames: {},
              },
              '0x2': {
                name: 'TestName4',
                sourceId: null,
                proposedNames: {},
              },
            },
            '0xc0ffee254729296a45a3885639ac7e10f9d54977': {
              '0x2': {
                name: 'TestName3',
                sourceId: null,
                proposedNames: {},
              },
            },
          },
        },
      },
    });
  });

  it('keeps existing name entries', async () => {
    const oldState = {
      OtherController: {},
      AddressBookController: {
        addressBook: {
          '0x1': {
            '0xc0ffee254729296a45a3885639AC7E10F9d54979': {
              name: 'TestName1',
              isEns: false,
            },
          },
        },
      },
      NameController: {
        names: {
          ethereumAddress: {
            '0xc0ffee254729296a45a3885639ac7e10f9d54978': {
              '0x1': {
                name: 'TestName2',
                sourceId: 'ens',
                proposedNames: {},
              },
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      ...oldState,
      NameController: {
        names: {
          ethereumAddress: {
            '0xc0ffee254729296a45a3885639ac7e10f9d54979': {
              '0x1': {
                name: 'TestName1',
                sourceId: null,
                proposedNames: {},
              },
            },
            '0xc0ffee254729296a45a3885639ac7e10f9d54978': {
              '0x1': {
                name: 'TestName2',
                sourceId: 'ens',
                proposedNames: {},
              },
            },
          },
        },
      },
    });
  });

  it('ignores address book entry if existing petname', async () => {
    const oldState = {
      OtherController: {},
      AddressBookController: {
        addressBook: {
          '0x1': {
            '0xc0ffee254729296a45a3885639AC7E10F9d54979': {
              name: 'TestName1',
              isEns: false,
            },
          },
        },
      },
      NameController: {
        names: {
          ethereumAddress: {
            '0xc0ffee254729296a45a3885639ac7e10f9d54979': {
              '0x1': {
                name: 'TestName2',
                sourceId: 'ens',
                proposedNames: {},
              },
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      ...oldState,
      NameController: {
        names: {
          ethereumAddress: {
            '0xc0ffee254729296a45a3885639ac7e10f9d54979': {
              '0x1': {
                name: 'TestName2',
                sourceId: 'ens',
                proposedNames: {},
              },
            },
          },
        },
      },
    });
  });

  it('ignores address book entry if no name or address', async () => {
    const oldState = {
      OtherController: {},
      AddressBookController: {
        addressBook: {
          '0x1': {
            '': {
              name: 'TestName1',
              isEns: false,
            },
            '0xc0ffee254729296a45a3885639AC7E10F9d54979': {
              name: '',
              isEns: false,
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      ...oldState,
      NameController: {
        names: {
          ethereumAddress: {},
        },
      },
    });
  });
});
