import { act } from '@testing-library/react';
import {
  BatchTransactionParams,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { toHex } from '@metamask/controller-utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import {
  CHAIN_ID,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import { useBalanceChanges } from '../../../simulation-details/useBalanceChanges';
import { getTokenStandardAndDetails } from '../../../../../../store/actions';
import { TokenStandard } from '../../../../../../../shared/constants/transaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { BalanceChange } from '../../../simulation-details/types';
import {
  buildApproveTransactionData,
  buildPermit2ApproveTransactionData,
} from '../../../../../../../test/data/confirmations/token-approve';
import { TOKEN_VALUE_UNLIMITED_THRESHOLD } from '../shared/constants';
import { buildSetApproveForAllTransactionData } from '../../../../../../../test/data/confirmations/set-approval-for-all';
import { useBatchApproveBalanceChanges } from './useBatchApproveBalanceChanges';

jest.mock('../../../simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(),
}));

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getTokenStandardAndDetails: jest.fn(),
}));

const TO_MOCK = '0x1234567891234567891234567891234567891234';
const TOKEN_ADDRESS_MOCK = '0x1234567891234567891234567891234567891235';
const AMOUNT_MOCK = 123;
const AMOUNT_HEX_MOCK = '0x7b';
const DATA_MOCK = buildApproveTransactionData(TO_MOCK, AMOUNT_MOCK);

const BALANCE_CHANGE_MOCK: BalanceChange = {
  asset: {
    address: '0x1234567891234567891234567891234567891234',
    chainId: '0x123',
    standard: TokenStandard.ERC20,
  },
  amount: new BigNumber('123.56'),
  fiatAmount: 12.34,
  isApproval: false,
  usdAmount: 12.34,
};

async function runHook({
  nestedTransactions,
}: {
  nestedTransactions?: BatchTransactionParams[];
}) {
  const response = renderHookWithConfirmContextProvider(
    useBatchApproveBalanceChanges,
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        nestedTransactions,
      }),
    ),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useBatchApproveBalanceChanges', () => {
  const useBalanceChangesMock = jest.mocked(useBalanceChanges);
  const getTokenStandardAndDetailsMock = jest.mocked(
    getTokenStandardAndDetails,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useBalanceChangesMock.mockReturnValue({ value: [], pending: false });
    getTokenStandardAndDetailsMock.mockResolvedValue({
      standard: TokenStandard.ERC20,
    });
  });

  it('returns balance changes with isApproval set to true', async () => {
    useBalanceChangesMock.mockReturnValue({
      value: [BALANCE_CHANGE_MOCK],
      pending: false,
    });

    const result = await runHook({
      nestedTransactions: [
        {
          data: DATA_MOCK,
          to: TO_MOCK,
        },
      ],
    });

    expect(result).toStrictEqual({
      pending: false,
      value: [
        {
          ...BALANCE_CHANGE_MOCK,
          isApproval: true,
          isAllApproval: false,
          isUnlimitedApproval: false,
          nestedTransactionIndex: 0,
        },
      ],
    });
  });

  it('generates ERC-20 token balance changes', async () => {
    await runHook({
      nestedTransactions: [
        {
          data: DATA_MOCK,
          to: TO_MOCK,
        },
      ],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [
          {
            address: TO_MOCK,
            difference: AMOUNT_HEX_MOCK,
            id: undefined,
            isAll: false,
            isDecrease: true,
            isUnlimited: false,
            nestedTransactionIndex: 0,
            newBalance: '0x0',
            previousBalance: '0x0',
            standard: SimulationTokenStandard.erc20,
          },
        ],
      },
    });
  });

  it('generates ERC-20 token balance changes from Permit2 approval', async () => {
    await runHook({
      nestedTransactions: [
        {
          data: buildPermit2ApproveTransactionData(
            TOKEN_ADDRESS_MOCK,
            TO_MOCK,
            AMOUNT_MOCK,
            456,
          ),
          to: TO_MOCK,
        },
      ],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [
          {
            address: TOKEN_ADDRESS_MOCK,
            difference: AMOUNT_HEX_MOCK,
            id: undefined,
            isAll: false,
            isDecrease: true,
            isUnlimited: false,
            nestedTransactionIndex: 0,
            newBalance: '0x0',
            previousBalance: '0x0',
            standard: SimulationTokenStandard.erc20,
          },
        ],
      },
    });

    expect(getTokenStandardAndDetailsMock).toHaveBeenCalledWith(
      TOKEN_ADDRESS_MOCK,
    );
  });

  it('generates unlimited ERC-20 token balance changes', async () => {
    const nestedTransaction: BatchTransactionParams = {
      data: buildApproveTransactionData(
        TO_MOCK,
        TOKEN_VALUE_UNLIMITED_THRESHOLD,
      ),
      to: TO_MOCK,
    };

    await runHook({
      nestedTransactions: [nestedTransaction],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [
          {
            address: TO_MOCK,
            difference: toHex(TOKEN_VALUE_UNLIMITED_THRESHOLD),
            id: undefined,
            isAll: false,
            isUnlimited: true,
            isDecrease: true,
            nestedTransactionIndex: 0,
            newBalance: '0x0',
            previousBalance: '0x0',
            standard: SimulationTokenStandard.erc20,
          },
        ],
      },
    });
  });

  it('generates ERC-721 token balance changes', async () => {
    getTokenStandardAndDetailsMock.mockResolvedValue({
      standard: TokenStandard.ERC721,
    });

    await runHook({
      nestedTransactions: [
        {
          data: DATA_MOCK,
          to: TO_MOCK,
        },
      ],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [
          {
            address: TO_MOCK,
            difference: '0x1',
            id: AMOUNT_HEX_MOCK,
            isAll: false,
            isDecrease: true,
            isUnlimited: false,
            nestedTransactionIndex: 0,
            newBalance: '0x0',
            previousBalance: '0x0',
            standard: SimulationTokenStandard.erc721,
          },
        ],
      },
    });
  });

  it('generates all ERC-721 token balance changes', async () => {
    getTokenStandardAndDetailsMock.mockResolvedValue({
      standard: TokenStandard.ERC721,
    });

    const nestedTransaction: BatchTransactionParams = {
      data: buildSetApproveForAllTransactionData(TO_MOCK, true),
      to: TO_MOCK,
    };

    await runHook({
      nestedTransactions: [nestedTransaction],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [
          {
            address: TO_MOCK,
            difference: '0x1',
            id: undefined,
            isAll: true,
            isDecrease: true,
            isUnlimited: false,
            nestedTransactionIndex: 0,
            newBalance: '0x0',
            previousBalance: '0x0',
            standard: SimulationTokenStandard.erc721,
          },
        ],
      },
    });
  });

  it('generates all ERC-1155 token balance changes', async () => {
    getTokenStandardAndDetailsMock.mockResolvedValue({
      standard: TokenStandard.ERC1155,
    });

    const nestedTransaction: BatchTransactionParams = {
      data: buildSetApproveForAllTransactionData(TO_MOCK, true),
      to: TO_MOCK,
    };

    await runHook({
      nestedTransactions: [nestedTransaction],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [
          {
            address: TO_MOCK,
            difference: '0x1',
            id: undefined,
            isAll: true,
            isDecrease: true,
            isUnlimited: false,
            nestedTransactionIndex: 0,
            newBalance: '0x0',
            previousBalance: '0x0',
            standard: SimulationTokenStandard.erc1155,
          },
        ],
      },
    });
  });

  it('generates no token balance changes if no nested transactions', async () => {
    await runHook({});

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [],
      },
    });
  });

  it('generates no token balance changes if no standard', async () => {
    getTokenStandardAndDetailsMock.mockResolvedValue({
      standard: undefined as never,
    });

    await runHook({
      nestedTransactions: [
        {
          data: DATA_MOCK,
          to: TO_MOCK,
        },
      ],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [],
      },
    });
  });

  it('generates no token balance changes if cannot be parsed', async () => {
    await runHook({
      nestedTransactions: [
        {
          data: '0x12345678',
          to: TO_MOCK,
        },
      ],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [],
      },
    });
  });

  it('generates no token balance changes if no to in nested transaction', async () => {
    await runHook({
      nestedTransactions: [
        {
          data: DATA_MOCK,
        },
      ],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [],
      },
    });
  });

  it('generates no token balance changes if no data in nested transaction', async () => {
    await runHook({
      nestedTransactions: [
        {
          to: TO_MOCK,
        },
      ],
    });

    expect(useBalanceChangesMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID,
      simulationData: {
        tokenBalanceChanges: [],
      },
    });
  });

  it('returns undefined if no balance changes transactions', async () => {
    const result = await runHook({});
    expect(result).toStrictEqual({ pending: false, value: [] });
  });
});
