import { useContext, useEffect, useState } from 'react';
import {
  SimulationData,
  SimulationErrorCode,
} from '@metamask/transaction-controller';
import { useTransactionEventFragment } from '../../hooks/useTransactionEventFragment';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import {
  UseDisplayNameResponse,
  useDisplayNames,
} from '../../../../hooks/useDisplayName';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { BalanceChange } from './types';
import {
  AssetType,
  FiatType,
  PetnameType,
  useSimulationMetrics,
} from './useSimulationMetrics';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
  useEffect: jest.fn(),
  useState: jest.fn(),
}));

jest.mock('../../../../hooks/useDisplayName');
jest.mock('../../../../hooks/useName');
jest.mock('../../../../pages/confirmations/hooks/useTransactionEventFragment');

const TRANSACTION_ID_MOCK = 'testTransactionId';
const LOADING_TIME_MOCK = 0.123;
const ADDRESS_MOCK = '0x123';
const SYMBOL_MOCK = 'TST';

const BALANCE_CHANGE_MOCK = {
  asset: { address: ADDRESS_MOCK, standard: TokenStandard.ERC20 },
  amount: { isNegative: true, quantity: '0x1', decimals: 18 },
  fiatAmount: 1.23,
} as unknown as BalanceChange;

const DISPLAY_NAME_UNKNOWN_MOCK = { hasPetname: false, name: null };

const DISPLAY_NAME_DEFAULT_MOCK = {
  hasPetname: false,
  name: SYMBOL_MOCK,
  contractDisplayName: SYMBOL_MOCK,
};

const DISPLAY_NAME_SAVED_MOCK = {
  hasPetname: true,
  name: 'testName',
  contractDisplayName: SYMBOL_MOCK,
};

describe('useSimulationMetrics', () => {
  const useTransactionEventFragmentMock = jest.mocked(
    useTransactionEventFragment,
  );

  const useStateMock = jest.mocked(useState);
  const useEffectMock = jest.mocked(useEffect);
  const useDisplayNamesMock = jest.mocked(useDisplayNames);
  const useContextMock = jest.mocked(useContext);
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updateTransactionEventFragmentMock: jest.MockedFunction<any>;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trackEventMock: jest.MockedFunction<any>;

  function expectUpdateTransactionEventFragmentCalled(
    {
      balanceChanges,
      simulationData,
    }: {
      balanceChanges?: BalanceChange[];
      simulationData?: SimulationData | undefined;
    },
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
  ) {
    useSimulationMetrics({
      balanceChanges: balanceChanges ?? [],
      simulationData,
      loadingTime: LOADING_TIME_MOCK,
      transactionId: TRANSACTION_ID_MOCK,
    });

    expect(updateTransactionEventFragmentMock).toHaveBeenCalledTimes(1);
    expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
      expected,
      TRANSACTION_ID_MOCK,
    );
  }

  beforeEach(() => {
    jest.resetAllMocks();

    updateTransactionEventFragmentMock = jest.fn();
    trackEventMock = jest.fn();

    useTransactionEventFragmentMock.mockReturnValue({
      updateTransactionEventFragment: updateTransactionEventFragmentMock,
    });

    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useStateMock.mockImplementation(((initialValue: any) => [
      initialValue,
      jest.fn(),
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]) as any);

    useEffectMock.mockImplementation((fn) => fn());
    useContextMock.mockReturnValue(trackEventMock);
    useDisplayNamesMock.mockReturnValue([DISPLAY_NAME_UNKNOWN_MOCK]);
  });

  describe('updates transaction event fragment', () => {
    it('with loading time', () => {
      useDisplayNamesMock.mockReset();
      useDisplayNamesMock.mockReturnValue([]);

      expectUpdateTransactionEventFragmentCalled(
        { simulationData: undefined },
        expect.objectContaining({
          properties: expect.objectContaining({
            simulation_latency: LOADING_TIME_MOCK,
          }),
        }),
      );
    });

    it.each([
      ['in progress', undefined, 'simulation_in_progress'],
      [
        'reverted',
        { error: { code: SimulationErrorCode.Reverted } },
        'transaction_revert',
      ],
      ['failed', { error: { message: 'testError' } }, 'failed'],
      ['no changes', { tokenBalanceChanges: [] }, 'no_balance_change'],
      ['changes', { tokenBalanceChanges: [{}] }, 'balance_change'],
    ])(
      'with simulation response if %s',
      (_, simulationData, simulationResponse) => {
        useDisplayNamesMock.mockReset();
        useDisplayNamesMock.mockReturnValue([]);

        expectUpdateTransactionEventFragmentCalled(
          {
            simulationData: simulationData as SimulationData,
          },
          expect.objectContaining({
            properties: expect.objectContaining({
              simulation_response: simulationResponse,
            }),
          }),
        );
      },
    );

    it.each([
      ['receiving', false, 'simulation_receiving_assets_quantity'],
      ['sending', true, 'simulation_sending_assets_quantity'],
    ])('with asset quantity if %s', (_, isNegative, property) => {
      const balanceChange = {
        ...BALANCE_CHANGE_MOCK,
        amount: { ...BALANCE_CHANGE_MOCK.amount, isNegative },
      };

      expectUpdateTransactionEventFragmentCalled(
        {
          balanceChanges: [balanceChange, balanceChange, balanceChange],
        },
        expect.objectContaining({
          properties: expect.objectContaining({
            [property]: 3,
          }),
        }),
      );
    });

    it.each([
      [
        'receiving ERC-20',
        TokenStandard.ERC20,
        false,
        'simulation_receiving_assets_type',
        [AssetType.ERC20],
      ],
      [
        'sending ERC-20',
        TokenStandard.ERC20,
        true,
        'simulation_sending_assets_type',
        [AssetType.ERC20],
      ],
      [
        'receiving ERC-721',
        TokenStandard.ERC721,
        false,
        'simulation_receiving_assets_type',
        [AssetType.ERC721],
      ],
      [
        'sending ERC-721',
        TokenStandard.ERC721,
        true,
        'simulation_sending_assets_type',
        [AssetType.ERC721],
      ],
      [
        'receiving ERC-1155',
        TokenStandard.ERC1155,
        false,
        'simulation_receiving_assets_type',
        [AssetType.ERC1155],
      ],
      [
        'sending ERC-1155',
        TokenStandard.ERC1155,
        true,
        'simulation_sending_assets_type',
        [AssetType.ERC1155],
      ],
      [
        'receiving native',
        TokenStandard.none,
        false,
        'simulation_receiving_assets_type',
        [AssetType.Native],
      ],
      [
        'sending native',
        TokenStandard.none,
        true,
        'simulation_sending_assets_type',
        [AssetType.Native],
      ],
    ])('with asset type if %s', (_, standard, isNegative, property, value) => {
      expectUpdateTransactionEventFragmentCalled(
        {
          balanceChanges: [
            {
              ...BALANCE_CHANGE_MOCK,
              asset: { ...BALANCE_CHANGE_MOCK.asset, standard },
              amount: { ...BALANCE_CHANGE_MOCK.amount, isNegative },
            } as BalanceChange,
          ],
        },
        expect.objectContaining({
          properties: expect.objectContaining({
            [property]: value,
          }),
        }),
      );
    });

    it.each([
      [
        'receiving and available',
        1.23,
        false,
        'simulation_receiving_assets_value',
        FiatType.Available,
      ],
      [
        'receiving and not available',
        null,
        false,
        'simulation_receiving_assets_value',
        FiatType.NotAvailable,
      ],
      [
        'sending and available',
        1.23,
        true,
        'simulation_sending_assets_value',
        FiatType.Available,
      ],
      [
        'sending and not available',
        null,
        true,
        'simulation_sending_assets_value',
        FiatType.NotAvailable,
      ],
    ])(
      'with asset value if %s',
      (_, fiatAmount, isNegative, property, expected) => {
        const balanceChange = {
          ...BALANCE_CHANGE_MOCK,
          amount: {
            ...BALANCE_CHANGE_MOCK.amount,
            isNegative,
          },
          fiatAmount,
        };

        expectUpdateTransactionEventFragmentCalled(
          {
            balanceChanges: [balanceChange],
          },
          expect.objectContaining({
            properties: expect.objectContaining({
              [property]: [expected],
            }),
          }),
        );
      },
    );

    it.each([
      [
        'receiving and native',
        false,
        TokenStandard.none,
        DISPLAY_NAME_UNKNOWN_MOCK,
        'simulation_receiving_assets_petname',
        PetnameType.Default,
      ],
      [
        'sending and native',
        true,
        TokenStandard.none,
        DISPLAY_NAME_UNKNOWN_MOCK,
        'simulation_sending_assets_petname',
        PetnameType.Default,
      ],
      [
        'receiving and default',
        false,
        TokenStandard.ERC20,
        DISPLAY_NAME_DEFAULT_MOCK,
        'simulation_receiving_assets_petname',
        PetnameType.Default,
      ],
      [
        'sending and default',
        true,
        TokenStandard.ERC20,
        DISPLAY_NAME_DEFAULT_MOCK,
        'simulation_sending_assets_petname',
        PetnameType.Default,
      ],
      [
        'receiving and saved',
        false,
        TokenStandard.ERC20,
        DISPLAY_NAME_SAVED_MOCK,
        'simulation_receiving_assets_petname',
        PetnameType.Saved,
      ],
      [
        'sending and saved',
        true,
        TokenStandard.ERC20,
        DISPLAY_NAME_SAVED_MOCK,
        'simulation_sending_assets_petname',
        PetnameType.Saved,
      ],
      [
        'receiving and unknown',
        false,
        TokenStandard.ERC20,
        DISPLAY_NAME_UNKNOWN_MOCK,
        'simulation_receiving_assets_petname',
        PetnameType.Unknown,
      ],
      [
        'sending and unknown',
        true,
        TokenStandard.ERC20,
        DISPLAY_NAME_UNKNOWN_MOCK,
        'simulation_sending_assets_petname',
        PetnameType.Unknown,
      ],
    ])(
      'with asset petname if %s',
      (_, isNegative, standard, displayName, property, expected) => {
        useDisplayNamesMock.mockReturnValue([
          displayName as UseDisplayNameResponse,
        ]);

        const balanceChange = {
          ...BALANCE_CHANGE_MOCK,
          amount: {
            ...BALANCE_CHANGE_MOCK.amount,
            isNegative,
          },
          asset: { ...BALANCE_CHANGE_MOCK.asset, standard },
        };

        expectUpdateTransactionEventFragmentCalled(
          {
            balanceChanges: [balanceChange as BalanceChange],
          },
          expect.objectContaining({
            properties: expect.objectContaining({
              [property]: [expected],
            }),
          }),
        );
      },
    );

    it.each([
      ['receiving', false, 'simulation_receiving_assets_total_value'],
      ['sending', true, 'simulation_sending_assets_total_value'],
    ])('with asset total value if %s', (_, isNegative, property) => {
      const balanceChange1 = {
        ...BALANCE_CHANGE_MOCK,
        amount: {
          ...BALANCE_CHANGE_MOCK.amount,
          isNegative,
        },
        fiatAmount: 1.23,
      };

      const balanceChange2 = {
        ...balanceChange1,
        fiatAmount: 1.23,
      };

      expectUpdateTransactionEventFragmentCalled(
        {
          balanceChanges: [balanceChange1, balanceChange2],
        },
        expect.objectContaining({
          sensitiveProperties: expect.objectContaining({
            [property]: 2.46,
          }),
        }),
      );
    });
  });

  describe('creates incomplete asset event', () => {
    it('if petname is unknown', () => {
      useSimulationMetrics({
        balanceChanges: [BALANCE_CHANGE_MOCK],
        simulationData: undefined,
        loadingTime: LOADING_TIME_MOCK,
        transactionId: TRANSACTION_ID_MOCK,
      });

      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Transactions,
        event: MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
        properties: {
          asset_address: ADDRESS_MOCK,
          asset_petname: PetnameType.Unknown,
          asset_symbol: undefined,
          asset_type: AssetType.ERC20,
          fiat_conversion_available: FiatType.Available,
          location: 'confirmation',
        },
      });
    });

    it('if fiat amount not available', () => {
      useDisplayNamesMock.mockReset();
      useDisplayNamesMock.mockReturnValue([DISPLAY_NAME_SAVED_MOCK]);

      useSimulationMetrics({
        balanceChanges: [{ ...BALANCE_CHANGE_MOCK, fiatAmount: null }],
        simulationData: undefined,
        loadingTime: LOADING_TIME_MOCK,
        transactionId: TRANSACTION_ID_MOCK,
      });

      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Transactions,
        event: MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
        properties: {
          asset_address: ADDRESS_MOCK,
          asset_petname: PetnameType.Saved,
          asset_symbol: SYMBOL_MOCK,
          asset_type: AssetType.ERC20,
          fiat_conversion_available: FiatType.NotAvailable,
          location: 'confirmation',
        },
      });
    });
  });

  it.each([
    ['simulation disabled', { error: { code: SimulationErrorCode.Disabled } }],
    [
      'chain not supported',
      { error: { code: SimulationErrorCode.ChainNotSupported } },
    ],
  ])('does not update fragment if %s', (_, simulationData) => {
    useSimulationMetrics({
      balanceChanges: [BALANCE_CHANGE_MOCK],
      simulationData: simulationData as SimulationData,
      loadingTime: LOADING_TIME_MOCK,
      transactionId: TRANSACTION_ID_MOCK,
    });

    expect(updateTransactionEventFragmentMock).not.toHaveBeenCalled();
  });
});
