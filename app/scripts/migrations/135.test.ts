import { cloneDeep } from 'lodash';
import { migrate, version } from './135';
import { Hex } from '@metamask/utils';
import { TokensControllerState } from '@metamask/assets-controllers';

const sentryCaptureExceptionMock = jest.fn();
const sentryCaptureMessageMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
  captureMessage: sentryCaptureMessageMock,
};

const oldVersion = 133;

const mockStateWithNullDecimals = {
  meta: { version: oldVersion },
  data: {
    TokensController: {
      allTokens: {
        '0x1': {
          '0x123': [
            { address: '0x1', symbol: 'TOKEN1', decimals: null },
            { address: '0x2', symbol: 'TOKEN2', decimals: 18 },
          ],
        },
      },
      allIgnoredTokens: {
        '0x1': {
          '0x123': [
            { address: '0x3', symbol: 'TOKEN3', decimals: null },
            { address: '0x4', symbol: 'TOKEN4', decimals: 8 },
          ],
        },
      },
      allDetectedTokens: {
        '0x1': {
          '0x123': [
            { address: '0x5', symbol: 'TOKEN5', decimals: null },
            { address: '0x6', symbol: 'TOKEN6', decimals: 6 },
          ],
        },
      },
    },
  },
};

describe(`migration #${version}`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('removes tokens with null decimals from allTokens', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    const newStorage = await migrate(oldStorage);

    const tokensControllerState = newStorage.data
      .TokensController as TokensControllerState;
    const allTokens = tokensControllerState.allTokens;

    expect(allTokens).toEqual({
      '0x1': {
        '0x123': [{ address: '0x2', symbol: 'TOKEN2', decimals: 18 }],
      },
    });
  });

  it('removes tokens with null decimals from allIgnoredTokens', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    const newStorage = await migrate(oldStorage);

    const tokensControllerState = newStorage.data
      .TokensController as TokensControllerState;
    const allIgnoredTokens = tokensControllerState.allIgnoredTokens;

    expect(allIgnoredTokens).toEqual({
      '0x1': {
        '0x123': [{ address: '0x4', symbol: 'TOKEN4', decimals: 8 }],
      },
    });
  });

  it('removes tokens with null decimals from allDetectedTokens', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    const newStorage = await migrate(oldStorage);

    const tokensControllerState = newStorage.data
      .TokensController as TokensControllerState;
    const allDetectedTokens = tokensControllerState.allDetectedTokens;

    expect(allDetectedTokens).toEqual({
      '0x1': {
        '0x123': [{ address: '0x6', symbol: 'TOKEN6', decimals: 6 }],
      },
    });
  });

  it('logs tokens with null decimals using Sentry before removing them', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    await migrate(oldStorage);

    expect(sentryCaptureMessageMock).toHaveBeenCalledTimes(3);
    expect(sentryCaptureMessageMock).toHaveBeenCalledWith(
      `Migration ${version}: Removed token with decimals === null in allTokens. Address: 0x1`,
    );
    expect(sentryCaptureMessageMock).toHaveBeenCalledWith(
      `Migration ${version}: Removed token with decimals === null in allIgnoredTokens. Address: 0x3`,
    );
    expect(sentryCaptureMessageMock).toHaveBeenCalledWith(
      `Migration ${version}: Removed token with decimals === null in allDetectedTokens. Address: 0x5`,
    );
  });

  it('does nothing if all tokens have valid decimals', async () => {
    const validState = {
      meta: { version: oldVersion },
      data: {
        TokensController: {
          allTokens: {
            '0x1': {
              '0x123': [{ address: '0x2', symbol: 'TOKEN2', decimals: 18 }],
            },
          },
          allIgnoredTokens: {
            '0x1': {
              '0x123': [{ address: '0x4', symbol: 'TOKEN4', decimals: 8 }],
            },
          },
          allDetectedTokens: {
            '0x1': {
              '0x123': [{ address: '0x6', symbol: 'TOKEN6', decimals: 6 }],
            },
          },
        },
      },
    };

    const oldStorage = cloneDeep(validState);
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
    expect(sentryCaptureMessageMock).not.toHaveBeenCalled();
  });

  it('does nothing if TokensController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.data).toStrictEqual(oldStorage.data);
    expect(sentryCaptureMessageMock).not.toHaveBeenCalled();
  });

  const invalidState = [
    {
      errorMessage: `Migration ${version}: Invalid allTokens state of type 'string'`,
      label: 'Invalid allTokens',
      state: { TokensController: { allTokens: 'invalid' } },
    },
    {
      errorMessage: `Migration ${version}: Invalid allIgnoredTokens state of type 'string'`,
      label: 'Invalid allIgnoredTokens',
      state: { TokensController: { allIgnoredTokens: 'invalid' } },
    },
    {
      errorMessage: `Migration ${version}: Invalid allDetectedTokens state of type 'string'`,
      label: 'Invalid allDetectedTokens',
      state: { TokensController: { allDetectedTokens: 'invalid' } },
    },
  ];

  // @ts-expect-error 'each' function is not recognized by TypeScript types
  it.each(invalidState)(
    'captures error when state is invalid due to: $label',
    async ({
      errorMessage,
      state,
    }: {
      errorMessage: string;
      state: Record<string, unknown>;
    }) => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: state,
      };

      const newStorage = await migrate(cloneDeep(oldStorage));

      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(errorMessage),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    },
  );
});
