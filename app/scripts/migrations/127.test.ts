import { cloneDeep } from 'lodash';
import { migrate, version } from './127';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 126;

describe(`migration #${version}`, () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if NftController state is not set', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('does nothing if obsolete NftController state is not present', async () => {
    const oldState = {
      NftController: {
        allNftContracts: {},
        allNfts: {},
        ignoredNfts: [],
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('captures error when NftController state is invalid, leaving state unchanged', async () => {
    const oldState = {
      NftController: 'invalid',
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual(oldState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: Invalid NftController state of type 'string'`,
      ),
    );
  });

  it('deletes NftController collectibles state if it exists, leaving valid state', async () => {
    const oldState = {
      NftController: {
        allNftContracts: {},
        allNfts: {},
        collectibles: {},
        ignoredNfts: [],
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NftController: {
        allNftContracts: {},
        allNfts: {},
        ignoredNfts: [],
      },
    });
  });

  it('deletes NftController collectibleContracts state if it exists, leaving valid state', async () => {
    const oldState = {
      NftController: {
        allNftContracts: {},
        allNfts: {},
        collectibleContracts: {},
        ignoredNfts: [],
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NftController: {
        allNftContracts: {},
        allNfts: {},
        ignoredNfts: [],
      },
    });
  });

  it('deletes all obsolete NftController state, leaving valid state', async () => {
    const oldState = {
      NftController: {
        allNftContracts: {},
        allNfts: {},
        collectibles: {},
        collectibleContracts: {},
        ignoredNfts: [],
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NftController: {
        allNftContracts: {},
        allNfts: {},
        ignoredNfts: [],
      },
    });
  });
});
