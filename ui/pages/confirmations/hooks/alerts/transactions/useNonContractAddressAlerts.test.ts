import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useIsUpgradeTransaction } from '../../../components/confirm/info/hooks/useIsUpgradeTransaction';
import { ConfirmContext } from '../../../context/confirm';
import type { ConfirmContextType } from '../../../context/confirm';
import type { Confirmation } from '../../../types/confirm';
import { useNonContractAddressAlerts } from './useNonContractAddressAlerts';
import { useContractCode } from './useContractCode';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock(
  '../../../components/confirm/info/hooks/useIsUpgradeTransaction',
  () => ({
    useIsUpgradeTransaction: jest.fn(),
  }),
);

const messageIdMock = '12345';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    id: messageIdMock,
  }),
  useLocation: jest.fn(),
}));

jest.mock('./useContractCode', () => ({
  useContractCode: jest.fn(),
}));

jest.mock('./NonContractAddressAlertMessage', () => ({
  NonContractAddressAlertMessage: () => 'NonContractAddressAlertMessage',
}));

const TRANSACTION_ID_MOCK = '123-456';
const ACCOUNT_ADDRESS_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const ACCOUNT_ADDRESS_2_MOCK = '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b';

type MockState = Parameters<typeof getMockConfirmState>[0];

const TRANSACTION_META_MOCK = {
  id: TRANSACTION_ID_MOCK,
  chainId: '0x5',
  networkClientId: 'testNetworkClientId',
  status: TransactionStatus.unapproved,
  type: TransactionType.contractInteraction,
  txParams: {
    from: ACCOUNT_ADDRESS_MOCK,
    to: ACCOUNT_ADDRESS_2_MOCK,
  },
  time: new Date().getTime() - 10000,
} as TransactionMeta;

function isTransactionMetaConfirmation(
  confirmation: Confirmation,
): confirmation is TransactionMeta {
  return 'txParams' in confirmation;
}

function runHook({
  currentConfirmation,
  stateOverrides,
}: {
  currentConfirmation?: Confirmation;
  stateOverrides?: MockState;
} = {}) {
  const confirmContextValue = {
    currentConfirmation,
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: jest.fn(),
  };

  const Container = ({ children }: { children: ReactNode }) =>
    createElement(
      ConfirmContext.Provider,
      {
        value: confirmContextValue as unknown as ConfirmContextType,
      },
      children,
    );

  const state =
    currentConfirmation && isTransactionMetaConfirmation(currentConfirmation)
      ? getMockConfirmStateForTransaction(currentConfirmation, stateOverrides)
      : getMockConfirmState(stateOverrides);

  return renderHookWithProvider(
    useNonContractAddressAlerts,
    state,
    '/',
    Container,
  );
}

describe('useNonContractAddressAlerts', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockUseIsUpgradeTransaction = jest.mocked(useIsUpgradeTransaction);
  const mockUseContractCode = jest.mocked(useContractCode);
  const useLocationMock = jest.mocked(useLocation);

  beforeEach(() => {
    jest.resetAllMocks();

    mockUseI18nContext.mockReturnValue(
      (translationKey: string) => translationKey,
    );

    mockUseIsUpgradeTransaction.mockReturnValue({
      isUpgrade: false,
      isUpgradeOnly: false,
    });

    useLocationMock.mockReturnValue({
      search: '',
    } as unknown as ReturnType<typeof useLocationMock>);

    mockUseContractCode.mockReturnValue({
      pending: false,
      value: {
        isContractAddress: false,
        contractCode: '',
      },
    } as ReturnType<typeof useContractCode>);
  });

  it('returns no alerts if no confirmation', () => {
    const { result } = runHook();

    expect(result.current).toEqual([]);
  });

  it('returns no alerts if the transaction has no data', () => {
    const transactionWithNoData = {
      ...TRANSACTION_META_MOCK,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        data: undefined,
      },
    };

    const { result } = runHook({
      currentConfirmation: transactionWithNoData,
    });

    expect(result.current).toEqual([]);
  });

  it('returns no alerts if the transaction has data but the recipient is a contract', () => {
    const transactionWithData = {
      ...TRANSACTION_META_MOCK,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        data: '0xabcdef',
      },
    };

    mockUseContractCode.mockReturnValue({
      pending: false,
      value: {
        isContractAddress: true,
        contractCode: '',
      },
    } as ReturnType<typeof useContractCode>);

    const { result } = runHook({
      currentConfirmation: transactionWithData,
    });

    expect(result.current).toEqual([]);
  });

  it('returns no alert for authorization request', () => {
    const authorizationList = [{ address: '0x123' as Hex }];
    const transaction = genUnapprovedContractInteractionConfirmation({
      authorizationList,
    });

    mockUseIsUpgradeTransaction.mockReturnValueOnce({
      isUpgrade: true,
      isUpgradeOnly: false,
    });

    const { result } = runHook({
      currentConfirmation: transaction,
    });

    expect(result.current).toEqual([]);
  });

  it('returns alert if the transaction has data and the recipient is not a contract', async () => {
    const transactionWithData = {
      ...TRANSACTION_META_MOCK,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        data: '0xabcdef',
      },
    };

    const { result } = runHook({
      currentConfirmation: transactionWithData,
    });

    await waitFor(() => {
      expect(result.current).toEqual([
        {
          field: RowAlertKey.InteractingWith,
          isBlocking: false,
          key: 'hexDataWhileInteractingWithNonContractAddress',
          reason: 'nonContractAddressAlertTitle',
          severity: Severity.Warning,
          content: 'NonContractAddressAlertMessage',
        },
      ]);
    });
  });

  it('returns no alerts if the transaction has data and the recipient is not a contract, but it is a contract deployment confirmation', async () => {
    const transactionWithData = {
      ...TRANSACTION_META_MOCK,
      type: TransactionType.deployContract,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        data: '0xabcdef',
      },
    };

    const { result } = runHook({
      currentConfirmation: transactionWithData,
    });

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it('returns no alerts if readAddressAsContract fails (contractCode is null)', async () => {
    const transactionWithData = {
      ...TRANSACTION_META_MOCK,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        data: '0xabcdef',
      },
    };

    mockUseContractCode.mockReturnValue({
      pending: false,
      value: {
        isContractAddress: false,
        contractCode: null,
      },
    } as ReturnType<typeof useContractCode>);

    const { result } = runHook({
      currentConfirmation: transactionWithData,
    });

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});
