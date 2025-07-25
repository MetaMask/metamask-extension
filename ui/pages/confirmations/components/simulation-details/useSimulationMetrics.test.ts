import { useContext, useEffect, useState } from 'react';
import {
  SimulationData,
  SimulationErrorCode,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { renderHook } from '@testing-library/react-hooks';
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
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { BalanceChange } from './types';
import {
  AssetType,
  FiatType,
  PetnameType,
  UseSimulationMetricsProps,
  useSimulationMetrics,
} from './useSimulationMetrics';
import { useLoadingTime } from './useLoadingTime';

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

jest.mock('./useLoadingTime');
jest.mock('../../../../hooks/useDisplayName');
jest.mock('../../../../hooks/useName');
jest.mock('../../../../pages/confirmations/hooks/useTransactionEventFragment');

const TRANSACTION_ID_MOCK = 'testTransactionId';
const LOADING_TIME_MOCK = 0.123;
const ADDRESS_MOCK = '0x123';
const SYMBOL_MOCK = 'TST';

const BALANCE_CHANGE_MOCK = {
  asset: { address: ADDRESS_MOCK, standard: TokenStandard.ERC20 },
  amount: new BigNumber(-1),
  fiatAmount: 1.23,
} as unknown as BalanceChange;

const DISPLAY_NAME_UNKNOWN_MOCK = {
  hasPetname: false,
  name: null,
  displayState: TrustSignalDisplayState.Unknown,
};

const DISPLAY_NAME_DEFAULT_MOCK = {
  hasPetname: false,
  name: SYMBOL_MOCK,
  contractDisplayName: SYMBOL_MOCK,
  displayState: TrustSignalDisplayState.Unknown,
};

const DISPLAY_NAME_SAVED_MOCK = {
  hasPetname: true,
  name: 'testName',
  contractDisplayName: SYMBOL_MOCK,
  displayState: TrustSignalDisplayState.Unknown,
};

describe('useSimulationMetrics', () => {
  const useTransactionEventFragmentMock = jest.mocked(
    useTransactionEventFragment,
  );

  const useStateMock = jest.mocked(useState);
  const useEffectMock = jest.mocked(useEffect);
  const useDisplayNamesMock = jest.mocked(useDisplayNames);
  const useContextMock = jest.mocked(useContext);
  const useLoadingTimeMock = jest.mocked(useLoadingTime);
  const setLoadingCompleteMock = jest.fn();

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updateTransactionEventFragmentMock: jest.MockedFunction<any>;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: any,
  ) {
    useSimulationMetrics({
      enableMetrics: true,
      balanceChanges: balanceChanges ?? [],
      simulationData,
      loading: false,
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

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useStateMock.mockImplementation(((initialValue: any) => [
      initialValue,
      jest.fn(),
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]) as any);

    useEffectMock.mockImplementation((fn) => fn());
    useContextMock.mockReturnValue(trackEventMock);
    useDisplayNamesMock.mockReturnValue([DISPLAY_NAME_UNKNOWN_MOCK]);
    useLoadingTimeMock.mockReturnValue({
      loadingTime: LOADING_TIME_MOCK,
      setLoadingComplete: setLoadingCompleteMock,
    });
  });

  describe('updates transaction event fragment', () => {
    it('with loading time', async () => {
      const props = {
        balanceChanges: [BALANCE_CHANGE_MOCK],
        loading: false,
        simulationData: { tokenBalanceChanges: [] } as SimulationData,
        transactionId: 'test-transaction-id',
        enableMetrics: true,
      };

      renderHook((p: UseSimulationMetricsProps) => useSimulationMetrics(p), {
        initialProps: props,
      });

      expect(setLoadingCompleteMock).toHaveBeenCalledTimes(1);
      expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            simulation_latency: LOADING_TIME_MOCK,
          }),
        }),
        'test-transaction-id',
      );
      jest.restoreAllMocks();
    });

    // @ts-expect-error This is missing from the Mocha type definitions
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
      (
        _: string,
        simulationData: Record<string, unknown>,
        simulationResponse: string,
      ) => {
        useDisplayNamesMock.mockReset();
        useDisplayNamesMock.mockReturnValue([]);

        expectUpdateTransactionEventFragmentCalled(
          {
            simulationData: simulationData as SimulationData,
          },
          expect.objectContaining({
            properties: expect.objectContaining({
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              simulation_response: simulationResponse,
            }),
          }),
        );
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['receiving', false, 'simulation_receiving_assets_quantity'],
      ['sending', true, 'simulation_sending_assets_quantity'],
    ])(
      'with asset quantity if %s',
      (_: string, isNegative: boolean, property: string) => {
        const balanceChange = {
          ...BALANCE_CHANGE_MOCK,
          amount: new BigNumber(isNegative ? -1 : 1),
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
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
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
    ])(
      'with asset type if %s',
      (
        _: string,
        standard: TokenStandard,
        isNegative: boolean,
        property: string,
        value: AssetType[],
      ) => {
        expectUpdateTransactionEventFragmentCalled(
          {
            balanceChanges: [
              {
                ...BALANCE_CHANGE_MOCK,
                asset: { ...BALANCE_CHANGE_MOCK.asset, standard },
                amount: new BigNumber(isNegative ? -1 : 1),
              } as BalanceChange,
            ],
          },
          expect.objectContaining({
            properties: expect.objectContaining({
              [property]: value,
            }),
          }),
        );
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
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
      (
        _: string,
        fiatAmount: number | null,
        isNegative: boolean,
        property: string,
        expected: FiatType,
      ) => {
        const balanceChange = {
          ...BALANCE_CHANGE_MOCK,
          amount: new BigNumber(isNegative ? -1 : 1),
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

    // @ts-expect-error This is missing from the Mocha type definitions
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
      (
        _: string,
        isNegative: boolean,
        standard: TokenStandard,
        displayName: Record<string, unknown>,
        property: string,
        expected: PetnameType,
      ) => {
        useDisplayNamesMock.mockReturnValue([
          displayName as UseDisplayNameResponse,
        ]);

        const balanceChange = {
          ...BALANCE_CHANGE_MOCK,
          amount: new BigNumber(isNegative ? -1 : 1),
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

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['receiving', false, 'simulation_receiving_assets_total_value'],
      ['sending', true, 'simulation_sending_assets_total_value'],
    ])(
      'with asset total value if %s',
      (_: string, isNegative: boolean, property: string) => {
        const balanceChange1 = {
          ...BALANCE_CHANGE_MOCK,
          amount: new BigNumber(isNegative ? -1 : 1),
          usdAmount: 1.23,
        };

        const balanceChange2 = {
          ...balanceChange1,
          usdAmount: 1.23,
        };

        expectUpdateTransactionEventFragmentCalled(
          {
            balanceChanges: [balanceChange1, balanceChange2],
          },
          expect.objectContaining({
            properties: expect.objectContaining({
              [property]: 2.46,
            }),
          }),
        );
      },
    );
  });

  describe('creates incomplete asset event', () => {
    it('if petname is unknown', () => {
      useSimulationMetrics({
        enableMetrics: true,
        balanceChanges: [BALANCE_CHANGE_MOCK],
        simulationData: undefined,
        loading: false,
        transactionId: TRANSACTION_ID_MOCK,
      });

      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Transactions,
        event: MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_address: ADDRESS_MOCK,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_petname: PetnameType.Unknown,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_symbol: undefined,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_type: AssetType.ERC20,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          fiat_conversion_available: FiatType.Available,
          location: 'confirmation',
        },
      });
    });

    it('if fiat amount not available', () => {
      useDisplayNamesMock.mockReset();
      useDisplayNamesMock.mockReturnValue([DISPLAY_NAME_SAVED_MOCK]);

      useSimulationMetrics({
        enableMetrics: true,
        balanceChanges: [{ ...BALANCE_CHANGE_MOCK, fiatAmount: null }],
        simulationData: undefined,
        loading: false,
        transactionId: TRANSACTION_ID_MOCK,
      });

      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Transactions,
        event: MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_address: ADDRESS_MOCK,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_petname: PetnameType.Saved,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_symbol: SYMBOL_MOCK,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_type: AssetType.ERC20,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          fiat_conversion_available: FiatType.NotAvailable,
          location: 'confirmation',
        },
      });
    });
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [
      'simulation disabled',
      true,
      { error: { code: SimulationErrorCode.Disabled } },
    ],
    [
      'chain not supported',
      true,
      { error: { code: SimulationErrorCode.ChainNotSupported } },
    ],
    ['metrics not enabled', false, undefined],
  ])(
    'does not update fragment if %s',
    (
      _: string,
      enableMetrics: boolean,
      simulationData: { error: { code: SimulationErrorCode } } | undefined,
    ) => {
      useSimulationMetrics({
        enableMetrics,
        balanceChanges: [BALANCE_CHANGE_MOCK],
        simulationData: simulationData as SimulationData,
        loading: false,
        transactionId: TRANSACTION_ID_MOCK,
      });

      expect(updateTransactionEventFragmentMock).not.toHaveBeenCalled();
    },
  );
});
