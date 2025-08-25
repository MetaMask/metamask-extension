import { cloneDeep } from 'lodash';
import { Token, TokensControllerState } from '@metamask/assets-controllers';
import { migrate, version } from './133.1';

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
      allDetectedTokens: {
        '0x1': {
          '0x123': [
            { address: '0x5', symbol: 'TOKEN5', decimals: null },
            { address: '0x6', symbol: 'TOKEN6', decimals: 6 },
          ],
        },
      },
      tokens: [
        { address: '0x7', symbol: 'TOKEN7', decimals: null },
        { address: '0x8', symbol: 'TOKEN8', decimals: 18 },
      ],
      detectedTokens: [
        { address: '0x9', symbol: 'TOKEN9', decimals: null },
        { address: '0xA', symbol: 'TOKEN10', decimals: 6 },
      ],
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
    const { allTokens } = tokensControllerState;

    expect(allTokens).toEqual({
      '0x1': {
        '0x123': [{ address: '0x2', symbol: 'TOKEN2', decimals: 18 }],
      },
    });
  });

  it('removes tokens with null decimals from allDetectedTokens', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    const newStorage = await migrate(oldStorage);

    const tokensControllerState = newStorage.data
      .TokensController as TokensControllerState;
    const { allDetectedTokens } = tokensControllerState;

    expect(allDetectedTokens).toEqual({
      '0x1': {
        '0x123': [{ address: '0x6', symbol: 'TOKEN6', decimals: 6 }],
      },
    });
  });

  it('removes tokens with null decimals from tokens array', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    const newStorage = await migrate(oldStorage);

    const tokensControllerState = newStorage.data
      .TokensController as TokensControllerState & {
      tokens: Token[];
      detectedTokens: Token[];
    };
    const { tokens } = tokensControllerState;

    expect(tokens).toEqual([
      { address: '0x8', symbol: 'TOKEN8', decimals: 18 },
    ]);
  });

  it('removes tokens with null decimals from detectedTokens array', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    const newStorage = await migrate(oldStorage);

    const tokensControllerState = newStorage.data
      .TokensController as TokensControllerState & {
      tokens: Token[];
      detectedTokens: Token[];
    };
    const { detectedTokens } = tokensControllerState;

    expect(detectedTokens).toEqual([
      { address: '0xA', symbol: 'TOKEN10', decimals: 6 },
    ]);
  });

  it('logs tokens with null decimals before removing them', async () => {
    const oldStorage = cloneDeep(mockStateWithNullDecimals);

    await migrate(oldStorage);

    expect(sentryCaptureMessageMock).toHaveBeenCalledTimes(4);
    expect(sentryCaptureMessageMock).toHaveBeenCalledWith(
      `Migration ${version}: Removed token with decimals === null in allTokens. Address: 0x1`,
    );
    expect(sentryCaptureMessageMock).toHaveBeenCalledWith(
      `Migration ${version}: Removed token with decimals === null in allDetectedTokens. Address: 0x5`,
    );
    expect(sentryCaptureMessageMock).toHaveBeenCalledWith(
      `Migration ${version}: Removed token with decimals === null in tokens. Address: 0x7`,
    );
    expect(sentryCaptureMessageMock).toHaveBeenCalledWith(
      `Migration ${version}: Removed token with decimals === null in detectedTokens. Address: 0x9`,
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
          allDetectedTokens: {
            '0x1': {
              '0x123': [{ address: '0x6', symbol: 'TOKEN6', decimals: 6 }],
            },
          },
          tokens: [{ address: '0x8', symbol: 'TOKEN8', decimals: 18 }],
          detectedTokens: [{ address: '0xA', symbol: 'TOKEN10', decimals: 6 }],
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
      errorMessage: `Migration ${version}: Invalid allDetectedTokens state of type 'string'`,
      label: 'Invalid allDetectedTokens',
      state: { TokensController: { allDetectedTokens: 'invalid' } },
    },
    {
      errorMessage: `Migration ${version}: Invalid tokens state of type 'string'`,
      label: 'Invalid tokens',
      state: { TokensController: { tokens: 'invalid' } },
    },
    {
      errorMessage: `Migration ${version}: Invalid detectedTokens state of type 'string'`,
      label: 'Invalid detectedTokens',
      state: { TokensController: { detectedTokens: 'invalid' } },
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
