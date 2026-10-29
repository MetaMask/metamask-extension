import { act, waitFor } from '@testing-library/react';
import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import { parseStandardTokenTransactionData } from '../../../../../shared/lib/transaction.utils';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../hooks/useConfirmationNavigation';
import {
  generateERC20TransferData,
  useDeveloperTransferTransaction,
} from './utils';

jest.mock('../../../../store/actions', () => ({
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('../../../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock('../../hooks/useConfirmationNavigation', () => ({
  ConfirmationLoader: {
    CustomAmount: 'customAmount',
  },
  useConfirmationNavigation: jest.fn(),
}));

const MOCK_RECIPIENT = '0x1234567890123456789012345678901234567890' as Hex;
const TRANSFER_SELECTOR = '0xa9059cbb';

describe('generateERC20TransferData', () => {
  it('starts with the ERC-20 `transfer(address,uint256)` selector', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '1', 6);

    expect(data.startsWith(TRANSFER_SELECTOR)).toBe(true);
    expect(data).toMatch(/^0x[0-9a-f]+$/iu);
  });

  it('encodes the recipient address left-padded to 32 bytes', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0', 6);

    const recipientWithoutPrefix = MOCK_RECIPIENT.toLowerCase().slice(2);
    expect(data.toLowerCase()).toContain(
      `000000000000000000000000${recipientWithoutPrefix}`,
    );
  });

  it('encodes a zero amount as 32 bytes of zeros (developer-scaffold case)', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0', 6);

    expect(data).toBe(
      `${TRANSFER_SELECTOR}` +
        `000000000000000000000000${MOCK_RECIPIENT.slice(
          2,
        ).toLowerCase()}0000000000000000000000000000000000000000000000000000000000000000`,
    );
  });

  it('scales a whole amount by the token decimals (1 USDC → 1_000_000)', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '1', 6);
    const parsed = parseStandardTokenTransactionData(data);

    expect(parsed?.name).toBe('transfer');
    expect(parsed?.args?.[1]?.toString()).toBe('1000000');
  });

  it('scales a fractional amount by the token decimals (0.5 USDC → 500_000)', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '0.5', 6);
    const parsed = parseStandardTokenTransactionData(data);

    expect(parsed?.args?.[1]?.toString()).toBe('500000');
  });

  it('scales by 10^decimals for 18-decimal tokens (2 MUSD → 2e18)', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '2', 18);
    const parsed = parseStandardTokenTransactionData(data);

    expect(parsed?.args?.[1]?.toString()).toBe('2000000000000000000');
  });

  it('round-trips the recipient through parseStandardTokenTransactionData', () => {
    const data = generateERC20TransferData(MOCK_RECIPIENT, '1', 6);
    const parsed = parseStandardTokenTransactionData(data);

    expect(parsed?.args?.[0]?.toLowerCase()).toBe(MOCK_RECIPIENT.toLowerCase());
  });
});

describe('useDeveloperTransferTransaction', () => {
  const addTransactionMock = jest.mocked(addTransaction);
  const findNetworkClientIdByChainIdMock = jest.mocked(
    findNetworkClientIdByChainId,
  );
  const getSelectedInternalAccountMock = jest.mocked(
    getSelectedInternalAccount,
  );
  const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);
  const navigateToTransactionMock = jest.fn();

  const SENDER_ADDRESS = '0xabcabcabcabcabcabcabcabcabcabcabcabcabca' as Hex;
  const TOKEN_ADDRESS = '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead' as Hex;
  const CHAIN_ID = '0x1' as Hex;
  const NETWORK_CLIENT_ID = 'mainnet';
  const TX_ID = 'tx-id';

  const BASE_OPTIONS = {
    chainId: CHAIN_ID,
    tokenAddress: TOKEN_ADDRESS,
    decimals: 6,
    type: TransactionType.moneyAccountDeposit,
    errorMessage: 'Failed to create transaction',
  };

  function renderTransferHook(
    options: Partial<
      Parameters<typeof useDeveloperTransferTransaction>[0]
    > = {},
  ) {
    return renderHookWithProvider(
      () => useDeveloperTransferTransaction({ ...BASE_OPTIONS, ...options }),
      mockState,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();

    getSelectedInternalAccountMock.mockReturnValue({
      address: SENDER_ADDRESS,
    } as never);
    findNetworkClientIdByChainIdMock.mockResolvedValue(NETWORK_CLIENT_ID);
    addTransactionMock.mockResolvedValue({ id: TX_ID } as never);
    useConfirmationNavigationMock.mockReturnValue({
      navigateToTransaction: navigateToTransactionMock,
    } as never);
  });

  it('creates a self-transfer transaction and navigates to it', async () => {
    const { result } = renderTransferHook();

    await act(async () => {
      await result.current.handleTrigger();
    });

    expect(findNetworkClientIdByChainIdMock).toHaveBeenCalledWith(CHAIN_ID);

    const [txParams, txOptions] = addTransactionMock.mock.calls[0];
    expect(txParams).toStrictEqual({
      from: SENDER_ADDRESS,
      to: TOKEN_ADDRESS,
      data: generateERC20TransferData(SENDER_ADDRESS, '0', 6),
      value: '0x0',
    });
    expect(txOptions).toStrictEqual({
      networkClientId: NETWORK_CLIENT_ID,
      type: TransactionType.moneyAccountDeposit,
    });
    expect(navigateToTransactionMock).toHaveBeenCalledWith(TX_ID, {
      loader: ConfirmationLoader.CustomAmount,
    });
  });

  it('uses a custom recipient when getRecipient is provided', async () => {
    const { result } = renderTransferHook({
      getRecipient: () => MOCK_RECIPIENT,
    });

    await act(async () => {
      await result.current.handleTrigger();
    });

    const [txParams] = addTransactionMock.mock.calls[0];
    expect(txParams.data).toBe(
      generateERC20TransferData(MOCK_RECIPIENT, '0', 6),
    );
  });

  it('does not create a transaction when there is no selected account', async () => {
    getSelectedInternalAccountMock.mockReturnValue(undefined as never);
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { result } = renderTransferHook();

    await act(async () => {
      await result.current.handleTrigger();
    });

    expect(addTransactionMock).not.toHaveBeenCalled();
    expect(navigateToTransactionMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('No selected account');

    consoleErrorSpy.mockRestore();
  });

  it('logs the error message and does not navigate when creation fails', async () => {
    const error = new Error('boom');
    addTransactionMock.mockRejectedValue(error);
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { result } = renderTransferHook();

    await act(async () => {
      await result.current.handleTrigger();
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create transaction',
        error,
      );
    });
    expect(navigateToTransactionMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
