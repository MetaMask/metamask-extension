import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { selectPendingApprovalsForNavigation } from '../../../../../selectors';
import { useNonContractAddressAlerts } from './useNonContractAddressAlerts';
import { useContractCode } from './useContractCode';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

const mockGetUnapprovedTransaction = jest.fn();
jest.mock('../../../../../selectors', () => ({
  ...jest.requireActual('../../../../../selectors'),
  getUnapprovedTransaction: (...args: unknown[]) =>
    mockGetUnapprovedTransaction(...args),
}));

jest.mock('./useContractCode', () => ({
  useContractCode: jest.fn(),
}));
jest.mock('./NonContractAddressAlertMessage', () => ({
  NonContractAddressAlertMessage: () => 'NonContractAddressAlertMessage',
}));

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const TRANSACTION_ID_MOCK = '123-456';
const ACCOUNT_ADDRESS_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const ACCOUNT_ADDRESS_2_MOCK = '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b';

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

function runHook({
  currentConfirmation,
}: {
  currentConfirmation?: TransactionMeta;
} = {}) {
  const state = currentConfirmation
    ? getMockConfirmStateForTransaction(currentConfirmation as TransactionMeta)
    : {};

  const response = renderHookWithConfirmContextProvider(
    useNonContractAddressAlerts,
    state,
  );

  return response.result.current;
}

describe('useNonContractAddressAlerts', () => {
  const useSelectorMock = useSelector as jest.Mock;
  const mockUseContractCode = jest.mocked(useContractCode);

  beforeEach(() => {
    jest.resetAllMocks();

    mockUseContractCode.mockImplementation(
      () =>
        ({
          pending: false,
          value: {
            isContractAddress: false,
            contractCode: '',
          },
        }) as ReturnType<typeof useContractCode>,
    );
  });

  it('returns no alerts if no confirmation', () => {
    const confirmation = TRANSACTION_META_MOCK;
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x5': {
            chainId: '0x5',
            name: 'Mainnet',
          },
        };
      } else if (selector === selectPendingApprovalsForNavigation) {
        return [confirmation];
      }

      return undefined;
    });

    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if the transaction has no data', () => {
    const transactionWithNoData = {
      ...TRANSACTION_META_MOCK,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        data: undefined,
      },
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x5': {
            chainId: '0x5',
            name: 'Mainnet',
          },
        };
      } else if (selector === selectPendingApprovalsForNavigation) {
        return [transactionWithNoData];
      }

      return undefined;
    });

    expect(
      runHook({
        currentConfirmation: transactionWithNoData,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if the transaction has data but the recipient is a contract', () => {
    const transactionWithData = {
      ...TRANSACTION_META_MOCK,
      txParams: {
        ...TRANSACTION_META_MOCK.txParams,
        data: '0xabcdef',
      },
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x5': {
            chainId: '0x5',
            name: 'Mainnet',
          },
        };
      } else if (selector === selectPendingApprovalsForNavigation) {
        return [transactionWithData];
      }

      return undefined;
    });

    mockUseContractCode.mockImplementation(
      () =>
        ({
          pending: false,
          value: {
            isContractAddress: true,
            contractCode: '',
          },
        }) as ReturnType<typeof useContractCode>,
    );

    expect(
      runHook({
        currentConfirmation: transactionWithData,
      }),
    ).toEqual([]);
  });

  it('returns no alert for authorization request', async () => {
    const authorizationList = [{ address: '0x123' as Hex }];
    const transaction = genUnapprovedContractInteractionConfirmation({
      authorizationList,
    });

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x5': {
            chainId: '0x5',
            name: 'Mainnet',
          },
        };
      } else if (selector === selectPendingApprovalsForNavigation) {
        return [transaction];
      }

      return undefined;
    });

    const { result } = renderHookWithConfirmContextProvider(
      useNonContractAddressAlerts,
      getMockConfirmStateForTransaction(transaction),
    );

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
    mockGetUnapprovedTransaction.mockReturnValue(transactionWithData);
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x5': {
            chainId: '0x5',
            name: 'Mainnet',
          },
        };
      } else if (selector === selectPendingApprovalsForNavigation) {
        return [transactionWithData];
      }

      return selector(
        getMockConfirmStateForTransaction(
          transactionWithData as TransactionMeta,
        ),
      );
    });

    const { result } = renderHookWithConfirmContextProvider(
      useNonContractAddressAlerts,
      getMockConfirmStateForTransaction(transactionWithData as TransactionMeta),
      '/',
      undefined,
      transactionWithData.id,
    );

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
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x5': {
            chainId: '0x5',
            name: 'Mainnet',
          },
        };
      } else if (selector === selectPendingApprovalsForNavigation) {
        return [transactionWithData];
      }

      return undefined;
    });

    const { result } = renderHookWithConfirmContextProvider(
      useNonContractAddressAlerts,
      getMockConfirmStateForTransaction(transactionWithData as TransactionMeta),
    );

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

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x5': {
            chainId: '0x5',
            name: 'Mainnet',
          },
        };
      } else if (selector === selectPendingApprovalsForNavigation) {
        return [transactionWithData];
      }

      return undefined;
    });

    mockUseContractCode.mockImplementation(
      () =>
        ({
          pending: false,
          value: {
            isContractAddress: false,
            contractCode: null, // simulate failure
          },
        }) as ReturnType<typeof useContractCode>,
    );

    const { result } = renderHookWithConfirmContextProvider(
      useNonContractAddressAlerts,
      getMockConfirmStateForTransaction(transactionWithData as TransactionMeta),
    );

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});
